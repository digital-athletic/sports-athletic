import { Logger } from "@/services/Logger";
import { type UserTeam } from "@/services/TeamService";
import { fireEvent, render, waitFor, within } from "@/utils/testUtils";
import AdditionalTrainingListScreen from "./AdditionalTrainingListScreen";

const mockGetUserTeams = jest.fn();
jest.mock("@/services/TeamService", () => ({
  getUserTeams: () => mockGetUserTeams(),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  Stack: { Screen: () => null },
}));

jest.mock("@/services/Logger", () => ({
  Logger: { logError: jest.fn(), logEvent: jest.fn() },
}));

// e.g. { id: "team-1", name: "Team Alpha", ownerId: "other-user" }
const generateTeam = (overrides: Partial<UserTeam> = {}): UserTeam => ({
  id: "team-1",
  name: "Team Alpha",
  ownerId: "other-user",
  ...overrides,
});

const OWN_TRAININGS = "Your trainings";

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUserTeams.mockResolvedValue([]);
});

describe("AdditionalTrainingListScreen: entries", () => {
  it("shows the own trainings entry first", async () => {
    mockGetUserTeams.mockResolvedValue([generateTeam({ name: "Team Alpha" })]);

    const { findByText, getAllByRole } = await render(
      <AdditionalTrainingListScreen />,
    );
    await findByText("Team Alpha");

    expect(
      within(getAllByRole("button")[0]).getByText(OWN_TRAININGS),
    ).toBeTruthy();
  });

  it("shows one entry per team after the own trainings entry in team order", async () => {
    mockGetUserTeams.mockResolvedValue([
      generateTeam({ id: "team-1", name: "Team Alpha" }),
      generateTeam({ id: "team-2", name: "Team Beta" }),
    ]);

    const { findByText, getAllByRole } = await render(
      <AdditionalTrainingListScreen />,
    );
    await findByText("Team Beta");

    const entries = getAllByRole("button");
    expect(entries).toHaveLength(3);
    expect(within(entries[1]).getByText("Team Alpha")).toBeTruthy();
    expect(within(entries[2]).getByText("Team Beta")).toBeTruthy();
  });

  it("shows only the own trainings entry when getUserTeams resolves an empty list", async () => {
    const { findByText, getAllByRole } = await render(
      <AdditionalTrainingListScreen />,
    );
    await findByText(OWN_TRAININGS);

    expect(getAllByRole("button")).toHaveLength(1);
  });

  it("logs the error when getUserTeams rejects", async () => {
    const error = new Error("network down");
    mockGetUserTeams.mockRejectedValue(error);

    await render(<AdditionalTrainingListScreen />);

    await waitFor(() => {
      expect(Logger.logError).toHaveBeenCalledWith(error);
    });
  });

  it("shows only the own trainings entry when getUserTeams rejects", async () => {
    mockGetUserTeams.mockRejectedValue(new Error("network down"));

    const { findByText, getAllByRole } = await render(
      <AdditionalTrainingListScreen />,
    );
    await waitFor(() => {
      expect(Logger.logError).toHaveBeenCalled();
    });
    await findByText(OWN_TRAININGS);

    expect(getAllByRole("button")).toHaveLength(1);
  });
});

describe("AdditionalTrainingListScreen: loading", () => {
  it("shows the own trainings entry and a loading indicator while teams load", async () => {
    mockGetUserTeams.mockReturnValue(new Promise(() => {}));

    const { getByText, getByLabelText } = await render(
      <AdditionalTrainingListScreen />,
    );

    expect(getByText(OWN_TRAININGS)).toBeTruthy();
    expect(getByLabelText("Loading teams")).toBeTruthy();
  });

  it("hides the loading indicator after the teams loaded", async () => {
    const { findByText, queryByLabelText } = await render(
      <AdditionalTrainingListScreen />,
    );
    await findByText(OWN_TRAININGS);

    await waitFor(() => {
      expect(queryByLabelText("Loading teams")).toBeNull();
    });
  });
});

describe("AdditionalTrainingListScreen: navigation", () => {
  it("pushes the workouts screen with the own trainings title when the own entry is pressed", async () => {
    const { findByText } = await render(<AdditionalTrainingListScreen />);

    await fireEvent.press(await findByText(OWN_TRAININGS));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/additional-training-workouts",
      params: { title: OWN_TRAININGS, source: "own" },
    });
  });

  it("pushes the workouts screen with the team name when a team entry is pressed", async () => {
    mockGetUserTeams.mockResolvedValue([generateTeam({ name: "Team Alpha" })]);

    const { findByText } = await render(<AdditionalTrainingListScreen />);

    await fireEvent.press(await findByText("Team Alpha"));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/additional-training-workouts",
      params: { title: "Team Alpha", source: "team" },
    });
  });
});
