import i18n from "@/i18n";
import { Logger } from "@/services/Logger";
import { type UserTeam } from "@/services/TeamService";
import { act, fireEvent, render, waitFor, within } from "@/utils/testUtils";
import AdditionalTrainingListScreen from "./AdditionalTrainingListScreen";

// Renders the Tabler icons as named host nodes, so the tests tell them apart.
jest.mock("@tabler/icons-react-native/IconBarbell", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconBarbell", props),
}));
jest.mock("@tabler/icons-react-native/IconUsersGroup", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconUsersGroup", props),
}));

const mockGetUserTeams = jest.fn();
jest.mock("@/services/TeamService", () => ({
  getUserTeams: () => mockGetUserTeams(),
}));

const mockPush = jest.fn();
const mockStackScreen = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useRouter: () => ({ back: jest.fn() }),
  Stack: {
    Screen: (props: { options: { title?: string } }) => {
      mockStackScreen(props);
      return null;
    },
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

describe("AdditionalTrainingListScreen: headline", () => {
  it("sets the additional trainings screen title", async () => {
    const { findByText } = await render(<AdditionalTrainingListScreen />);
    await findByText(OWN_TRAININGS);

    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ title: "Additional trainings" }),
      }),
    );
  });

  it("shows the headline as a header", async () => {
    const { findByRole } = await render(<AdditionalTrainingListScreen />);

    expect(
      await findByRole("header", { name: "Additional trainings" }),
    ).toBeTruthy();
  });

  it("shows the subtitle in English", async () => {
    const { findByText } = await render(<AdditionalTrainingListScreen />);

    expect(
      await findByText("Your own trainings and the trainings of your teams."),
    ).toBeTruthy();
  });

  it("shows the subtitle in German", async () => {
    await act(() => i18n.changeLanguage("de"));
    const { findByText } = await render(<AdditionalTrainingListScreen />);

    expect(
      await findByText(
        "Deine eigenen Trainings und die Trainings deiner Teams.",
      ),
    ).toBeTruthy();
  });
});

describe("AdditionalTrainingListScreen: tiles", () => {
  it("shows the entries in a two column card grid", async () => {
    mockGetUserTeams.mockResolvedValue([generateTeam({ name: "Team Alpha" })]);

    const { findByText, getByTestId } = await render(
      <AdditionalTrainingListScreen />,
    );
    await findByText("Team Alpha");

    const grid = getByTestId("additional-training-grid");
    expect(within(grid).getAllByRole("button")).toHaveLength(2);
  });

  it("shows the workout builder icon on the own trainings tile", async () => {
    const { findByRole } = await render(<AdditionalTrainingListScreen />);

    const tile = await findByRole("button", { name: OWN_TRAININGS });
    expect(tile.queryAll((node) => node.type === "IconBarbell")).toHaveLength(
      1,
    );
    expect(
      tile.queryAll((node) => node.type === "IconUsersGroup"),
    ).toHaveLength(0);
  });

  it("shows a group icon on a team tile", async () => {
    mockGetUserTeams.mockResolvedValue([generateTeam({ name: "Team Alpha" })]);

    const { findByRole } = await render(<AdditionalTrainingListScreen />);

    const tile = await findByRole("button", { name: "Team Alpha" });
    expect(
      tile.queryAll((node) => node.type === "IconUsersGroup"),
    ).toHaveLength(1);
    expect(tile.queryAll((node) => node.type === "IconBarbell")).toHaveLength(
      0,
    );
  });
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
