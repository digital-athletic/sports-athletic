import type { Template } from "@/schemas/aiwl.schema";
import {
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { useDrawnWorkoutsStore } from "@/store/drawnWorkoutsStore";
import { generateDrawnWorkout } from "@test/factories/drawnWorkout";
import { syncTeamWorkouts } from "./syncTeamWorkouts";

const mockFetchTeamWorkouts = jest.fn();
jest.mock("@/services/TeamService", () => ({
  fetchTeamWorkouts: (teamId: string) => mockFetchTeamWorkouts(teamId),
}));

// The last change of a team workout, as Supabase returns team_workouts.updated_at.
const UPDATED_AT = "2026-11-01T08:00:00.123456+00:00";

// The rows as TeamService returns them, e.g. [{ template, isDraft: false, updatedAt: UPDATED_AT }].
const asPublished = (...templates: unknown[]) =>
  templates.map((template) => ({
    template,
    isDraft: false,
    updatedAt: UPDATED_AT,
  }));

// e.g. { aiwl: 1, id: "TEAM_CORE", name: { en: "Team core" }, blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }] }
const generateTeamTemplate = (overrides: Partial<Template> = {}): Template => ({
  aiwl: 1,
  id: "TEAM_CORE",
  name: { en: "Team core" },
  blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }],
  ...overrides,
});

const listTeamTemplateIds = (teamId: string | null): string[] =>
  listWorkoutsForTeam(
    useCustomWorkoutsStore.getState().workoutsById,
    teamId,
  ).map((workout) => workout.template.id);

beforeEach(() => {
  jest.clearAllMocks();
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
  useDrawnWorkoutsStore.getState().clearDrawnWorkouts();
});

afterEach(() => {
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
});

describe("syncTeamWorkouts", () => {
  it("stores the valid workouts for the team and reports synced", async () => {
    mockFetchTeamWorkouts.mockResolvedValue(
      asPublished(
        generateTeamTemplate({ id: "A" }),
        generateTeamTemplate({ id: "B" }),
      ),
    );

    const result = await syncTeamWorkouts("team-1");

    expect(result).toBe("synced");
    expect(listTeamTemplateIds("team-1")).toEqual(["A", "B"]);
  });

  it("stores which workouts are drafts", async () => {
    mockFetchTeamWorkouts.mockResolvedValue([
      {
        template: generateTeamTemplate({ id: "A" }),
        isDraft: false,
        updatedAt: UPDATED_AT,
      },
      {
        template: generateTeamTemplate({ id: "B" }),
        isDraft: true,
        updatedAt: UPDATED_AT,
      },
    ]);

    await syncTeamWorkouts("team-1");

    const drafts = listWorkoutsForTeam(
      useCustomWorkoutsStore.getState().workoutsById,
      "team-1",
    ).map((workout) => [workout.template.id, workout.isDraft === true]);
    expect(drafts).toEqual([
      ["A", false],
      ["B", true],
    ]);
  });

  it("stores the updated_at of each row as modifiedAt", async () => {
    mockFetchTeamWorkouts.mockResolvedValue(
      asPublished(generateTeamTemplate({ id: "A" })),
    );

    await syncTeamWorkouts("team-1");

    expect(
      listWorkoutsForTeam(
        useCustomWorkoutsStore.getState().workoutsById,
        "team-1",
      ).map((workout) => workout.modifiedAt),
    ).toEqual([UPDATED_AT]);
  });

  it("leaves out a workout that fails the import rules", async () => {
    mockFetchTeamWorkouts.mockResolvedValue(
      asPublished(
        generateTeamTemplate({ id: "A" }),
        generateTeamTemplate({
          id: "UNKNOWN_SKILL",
          blocks: [
            {
              kind: "picks",
              skill: "NO_SKILL",
              picks: [{ tags: [], count: 2 }],
            },
          ],
        }),
        { aiwl: 1, id: "BROKEN" },
      ),
    );

    await syncTeamWorkouts("team-1");

    expect(listTeamTemplateIds("team-1")).toEqual(["A"]);
  });

  it("leaves out a workout with an exercises block", async () => {
    mockFetchTeamWorkouts.mockResolvedValue(
      asPublished(
        generateTeamTemplate({ id: "A" }),
        generateTeamTemplate({
          id: "LIFTS",
          blocks: [
            {
              kind: "exercises",
              skill: "TEST",
              exercises: ["25"],
              testSets: [{ share: 1, repetitions: "amrap", rest: 0 }],
            },
          ],
        }),
      ),
    );

    await syncTeamWorkouts("team-1");

    expect(listTeamTemplateIds("team-1")).toEqual(["A"]);
  });

  it("reports offline and leaves the last sync in place when the fetch fails", async () => {
    mockFetchTeamWorkouts.mockResolvedValueOnce(
      asPublished(generateTeamTemplate({ id: "A" })),
    );
    await syncTeamWorkouts("team-1");
    mockFetchTeamWorkouts.mockRejectedValueOnce(new Error("Failed to fetch"));

    const result = await syncTeamWorkouts("team-1");

    expect(result).toBe("offline");
    expect(listTeamTemplateIds("team-1")).toEqual(["A"]);
  });

  it("discards the drawn workouts of a team workout the sync no longer lists", async () => {
    const { saveCustomWorkout } = useCustomWorkoutsStore.getState();
    const kept = saveCustomWorkout(generateTeamTemplate({ id: "A" }), "team-1");
    const removed = saveCustomWorkout(
      generateTeamTemplate({ id: "B" }),
      "team-1",
    );
    const { saveDrawnWorkout } = useDrawnWorkoutsStore.getState();
    saveDrawnWorkout(kept.id, "HOME", generateDrawnWorkout("510"));
    saveDrawnWorkout(removed.id, "HOME", generateDrawnWorkout("523"));
    mockFetchTeamWorkouts.mockResolvedValue(
      asPublished(generateTeamTemplate({ id: "A" })),
    );

    await syncTeamWorkouts("team-1");

    expect(Object.keys(useDrawnWorkoutsStore.getState().drawnWorkouts)).toEqual(
      [kept.id],
    );
  });
});
