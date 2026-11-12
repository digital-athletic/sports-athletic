import type { Template } from "@/schemas/aiwl.schema";
import {
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { syncTeamWorkouts } from "./syncTeamWorkouts";

const mockFetchTeamWorkoutTemplates = jest.fn();
jest.mock("@/services/TeamService", () => ({
  fetchTeamWorkoutTemplates: (teamId: string) =>
    mockFetchTeamWorkoutTemplates(teamId),
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
});

afterEach(() => {
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
});

describe("syncTeamWorkouts", () => {
  it("stores the valid workouts for the team and reports synced", async () => {
    mockFetchTeamWorkoutTemplates.mockResolvedValue([
      generateTeamTemplate({ id: "A" }),
      generateTeamTemplate({ id: "B" }),
    ]);

    const result = await syncTeamWorkouts("team-1");

    expect(result).toBe("synced");
    expect(listTeamTemplateIds("team-1")).toEqual(["A", "B"]);
  });

  it("leaves out a workout that fails the import rules", async () => {
    mockFetchTeamWorkoutTemplates.mockResolvedValue([
      generateTeamTemplate({ id: "A" }),
      generateTeamTemplate({
        id: "UNKNOWN_SKILL",
        blocks: [
          { kind: "picks", skill: "NO_SKILL", picks: [{ tags: [], count: 2 }] },
        ],
      }),
      { aiwl: 1, id: "BROKEN" },
    ]);

    await syncTeamWorkouts("team-1");

    expect(listTeamTemplateIds("team-1")).toEqual(["A"]);
  });

  it("reports offline and leaves the last sync in place when the fetch fails", async () => {
    mockFetchTeamWorkoutTemplates.mockResolvedValueOnce([
      generateTeamTemplate({ id: "A" }),
    ]);
    await syncTeamWorkouts("team-1");
    mockFetchTeamWorkoutTemplates.mockRejectedValueOnce(
      new Error("Failed to fetch"),
    );

    const result = await syncTeamWorkouts("team-1");

    expect(result).toBe("offline");
    expect(listTeamTemplateIds("team-1")).toEqual(["A"]);
  });
});
