import { type AlertButton } from "@/common/Alert";
import { type Template } from "@/schemas/aiwl.schema";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { useDrawnWorkoutsStore } from "@/store/drawnWorkoutsStore";
import { act, fireEvent, render } from "@/utils/testUtils";
import { TeamTrainingsList } from "./TeamTrainingsList";
import { generateDrawnWorkout } from "@test/factories/drawnWorkout";

jest.mock("expo-router", () => ({ router: { navigate: jest.fn() } }));

const mockAlert = jest.fn();
jest.mock("@/common/Alert", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

const mockFetchTeamWorkouts = jest.fn();
jest.mock("@/services/TeamService", () => ({
  fetchTeamWorkouts: (teamId: string) => mockFetchTeamWorkouts(teamId),
}));

// The rows as TeamService returns them, e.g. [{ template, isDraft: false }].
const asPublished = (...templates: unknown[]) =>
  templates.map((template) => ({ template, isDraft: false }));

// e.g. { aiwl: 1, id: "TEAM_CORE", name: { en: "Team core" }, blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }] }
const generateTeamTemplate = (overrides: Partial<Template> = {}): Template => ({
  aiwl: 1,
  id: "TEAM_CORE",
  name: { en: "Team core" },
  blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 2 }] }],
  ...overrides,
});

const EMPTY_MESSAGE = "Currently no workouts available";
const OFFLINE_NOTE =
  "You are offline. The list shows the trainings of the last sync.";

beforeEach(() => {
  jest.clearAllMocks();
  useCustomWorkoutsStore.getState().clearCustomWorkouts();
  useDrawnWorkoutsStore.setState({ drawnWorkouts: {} });
});

describe("TeamTrainingsList", () => {
  it("shows one tile per team workout on a tile grid", async () => {
    mockFetchTeamWorkouts.mockResolvedValue(
      asPublished(
        generateTeamTemplate(),
        generateTeamTemplate({
          id: "TEAM_SPRINT",
          name: { en: "Team sprint" },
        }),
      ),
    );

    const { findByRole, getAllByTestId } = await render(
      <TeamTrainingsList teamId="team-1" />,
    );

    expect(await findByRole("button", { name: "Team core" })).toBeTruthy();
    expect(await findByRole("button", { name: "Team sprint" })).toBeTruthy();
    expect(getAllByTestId("team-trainings-grid-cell")).toHaveLength(2);
  });

  it("shows no delete button on a team workout", async () => {
    mockFetchTeamWorkouts.mockResolvedValue(
      asPublished(generateTeamTemplate()),
    );

    const { findByRole, queryByRole } = await render(
      <TeamTrainingsList teamId="team-1" />,
    );

    await findByRole("button", { name: "Team core" });
    expect(queryByRole("button", { name: "Delete Team core" })).toBeNull();
  });

  it("marks a draft and leaves a published workout unmarked", async () => {
    mockFetchTeamWorkouts.mockResolvedValue([
      { template: generateTeamTemplate(), isDraft: false },
      {
        template: generateTeamTemplate({
          id: "TEAM_SPRINT",
          name: { en: "Team sprint" },
        }),
        isDraft: true,
      },
    ]);

    const { findByRole, getAllByText } = await render(
      <TeamTrainingsList teamId="team-1" />,
    );

    expect(
      await findByRole("button", { name: "Team sprint, Draft" }),
    ).toBeTruthy();
    expect(await findByRole("button", { name: "Team core" })).toBeTruthy();
    expect(getAllByText("Draft")).toHaveLength(1);
  });

  it("shows the offline note above the tiles of the last sync", async () => {
    useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(generateTeamTemplate(), "team-1");
    mockFetchTeamWorkouts.mockRejectedValue(new Error("Failed to fetch"));

    const { findByText, getByRole } = await render(
      <TeamTrainingsList teamId="team-1" />,
    );

    expect(await findByText(OFFLINE_NOTE)).toBeTruthy();
    expect(getByRole("button", { name: "Team core" })).toBeTruthy();
  });

  it("shows the empty message and the offline note without a previous sync", async () => {
    mockFetchTeamWorkouts.mockRejectedValue(new Error("Failed to fetch"));

    const { findByText } = await render(<TeamTrainingsList teamId="team-1" />);

    expect(await findByText(OFFLINE_NOTE)).toBeTruthy();
    expect(await findByText(EMPTY_MESSAGE)).toBeTruthy();
  });
});

const SPRINT = { id: "TEAM_SPRINT", name: { en: "Team sprint" } };

describe("TeamTrainingsList: drawn workouts", () => {
  it("shows a refresh button in place of the delete button and discards only the drawn workouts of that workout on confirm", async () => {
    mockFetchTeamWorkouts.mockResolvedValue(
      asPublished(generateTeamTemplate(), generateTeamTemplate(SPRINT)),
    );
    const { saveCustomWorkout } = useCustomWorkoutsStore.getState();
    const core = saveCustomWorkout(generateTeamTemplate(), "team-1");
    const sprint = saveCustomWorkout(generateTeamTemplate(SPRINT), "team-1");
    useDrawnWorkoutsStore.setState({
      drawnWorkouts: {
        [core.id]: { HOME: generateDrawnWorkout("510") },
        [sprint.id]: { HOME: generateDrawnWorkout("523") },
      },
    });
    const { findByRole, queryByRole } = await render(
      <TeamTrainingsList teamId="team-1" />,
    );

    await fireEvent.press(
      await findByRole("button", { name: "Refresh Team core" }),
    );
    const [title, message, buttons]: [string, string, AlertButton[]] =
      mockAlert.mock.calls[0];
    await act(() => buttons.find(({ text }) => text === "Create")?.onPress?.());

    expect(queryByRole("button", { name: /^Delete / })).toBeNull();
    expect([title, message]).toEqual([
      "New version",
      "Create a new version of Team core?",
    ]);
    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({
      [sprint.id]: { HOME: generateDrawnWorkout("523") },
    });
  });
});
