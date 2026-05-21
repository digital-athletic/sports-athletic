import {
  act,
  fireEvent,
  render,
  renderAsync,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "@/common/Alert";
import JoinTeamScreen from "./JoinTeamScreen";

const mockGetUserTeams = jest.fn();
const mockAcceptInvitation = jest.fn();
const mockLeaveTeam = jest.fn();
jest.mock("@/services/TeamService", () => ({
  getUserTeams: () => mockGetUserTeams(),
  acceptInvitation: (code: string) => mockAcceptInvitation(code),
  leaveTeam: (id: string) => mockLeaveTeam(id),
}));

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  Stack: {
    Screen: ({ options }: { options: { title: string } }) => null,
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) =>
      opts?.teamName ? `${key}:${opts.teamName}` : key,
  }),
}));

jest.mock("@/store/authStore", () => ({
  useAuthStore: (
    selector: (s: { auth: { userId: string } | null }) => unknown,
  ) => selector({ auth: { userId: "user-123" } }),
}));

jest.mock("@/theme/Box", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/theme/ScrollBox", () => ({
  ScrollBox: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/theme/Text", () => ({
  Text: ({ children }: { children: React.ReactNode }) => {
    const { Text: RNText } = require("react-native");
    return <RNText>{children}</RNText>;
  },
}));

jest.mock("@/theme/Button", () => ({
  Button: ({
    children,
    onPress,
    disabled,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
  }) => {
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock("@/theme/theme", () => ({
  useTheme: () => ({
    colors: { lightGrey2: "#f5f5f5", darkGrey3: "#333333" },
    spacing: {},
  }),
}));

jest.mock("@/services/Logger", () => ({
  Logger: { logError: jest.fn(), logEvent: jest.fn() },
}));

jest.spyOn(Alert, "alert");

interface Team {
  id: string;
  name: string;
  ownerId: string;
}

const makeTeam = (overrides: Partial<Team> = {}): Team => ({
  id: "team-1",
  name: "Team Alpha",
  ownerId: "other-user",
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUserTeams.mockResolvedValue([]);
});

describe("JoinTeamScreen: getUserTeams on mount", () => {
  it("shows ActivityIndicator while teams are loading", async () => {
    // Never resolves during this test, keeps loading state
    mockGetUserTeams.mockReturnValue(new Promise(() => {}));

    const { getByTestId } = render(<JoinTeamScreen />);

    expect(getByTestId("teams-loading-indicator")).toBeTruthy();
  });

  it("shows noTeams key when getUserTeams returns empty array", async () => {
    mockGetUserTeams.mockResolvedValue([]);

    const { findByText } = await renderAsync(<JoinTeamScreen />);

    expect(await findByText("more.joinTeam.noTeams")).toBeTruthy();
  });

  it("renders team names when getUserTeams returns teams", async () => {
    mockGetUserTeams.mockResolvedValue([
      makeTeam({ id: "team-1", name: "Team Alpha" }),
      makeTeam({ id: "team-2", name: "Team Beta", ownerId: "user-123" }),
    ]);

    const { findByText } = await renderAsync(<JoinTeamScreen />);

    expect(await findByText("Team Alpha")).toBeTruthy();
    expect(await findByText("Team Beta")).toBeTruthy();
  });

  it("shows Leave button for teams where ownerId !== userId", async () => {
    mockGetUserTeams.mockResolvedValue([
      makeTeam({ id: "team-1", ownerId: "other-user" }),
    ]);

    const { findByText } = await renderAsync(<JoinTeamScreen />);

    expect(await findByText("more.joinTeam.leave")).toBeTruthy();
  });

  it("does NOT show Leave button for teams where ownerId === userId", async () => {
    mockGetUserTeams.mockResolvedValue([
      makeTeam({ id: "team-1", ownerId: "user-123" }),
    ]);

    const { queryByText, findByText } = await renderAsync(<JoinTeamScreen />);

    await findByText(makeTeam({ ownerId: "user-123" }).name);

    expect(queryByText("more.joinTeam.leave")).toBeNull();
  });
});

describe("JoinTeamScreen: Leave flow", () => {
  it("calls Alert.alert when Leave button is tapped", async () => {
    mockGetUserTeams.mockResolvedValue([
      makeTeam({ id: "team-1", ownerId: "other-user" }),
    ]);

    const { findByText } = await renderAsync(<JoinTeamScreen />);
    const leaveButton = await findByText("more.joinTeam.leave");

    fireEvent.press(leaveButton);

    expect(Alert.alert).toHaveBeenCalled();
  });

  it("calls leaveTeam with correct teamId when user confirms via Alert", async () => {
    mockGetUserTeams.mockResolvedValue([
      makeTeam({ id: "team-1", ownerId: "other-user" }),
    ]);
    mockLeaveTeam.mockResolvedValue(undefined);

    const { findByText } = await renderAsync(<JoinTeamScreen />);
    const leaveButton = await findByText("more.joinTeam.leave");

    fireEvent.press(leaveButton);

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons: { onPress?: () => void }[] = alertCall[2];
    const confirmButton = buttons.find((b) => b.onPress !== undefined);

    await act(async () => {
      confirmButton?.onPress?.();
    });

    expect(mockLeaveTeam).toHaveBeenCalledWith("team-1");
  });

  it("removes team from list after successful leave", async () => {
    mockGetUserTeams.mockResolvedValue([
      makeTeam({ id: "team-1", name: "Team Alpha", ownerId: "other-user" }),
    ]);
    mockLeaveTeam.mockResolvedValue(undefined);

    const { findByText, queryByText } = await renderAsync(<JoinTeamScreen />);
    const leaveButton = await findByText("more.joinTeam.leave");

    fireEvent.press(leaveButton);

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons: { onPress?: () => void }[] = alertCall[2];
    const confirmButton = buttons.find((b) => b.onPress !== undefined);

    await act(async () => {
      confirmButton?.onPress?.();
    });

    await waitFor(() => {
      expect(queryByText("Team Alpha")).toBeNull();
    });
  });

  it("shows leave error key when leaveTeam throws", async () => {
    mockGetUserTeams.mockResolvedValue([
      makeTeam({ id: "team-1", ownerId: "other-user" }),
    ]);
    mockLeaveTeam.mockRejectedValue(new Error("more.joinTeam.errorLeave"));

    const { findByText } = await renderAsync(<JoinTeamScreen />);
    const leaveButton = await findByText("more.joinTeam.leave");

    fireEvent.press(leaveButton);

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons: { onPress?: () => void }[] = alertCall[2];
    const confirmButton = buttons.find((b) => b.onPress !== undefined);

    await act(async () => {
      confirmButton?.onPress?.();
    });

    expect(await findByText("more.joinTeam.errorLeave")).toBeTruthy();
  });

  it("disables Leave button for the specific team while leave is in progress", async () => {
    mockGetUserTeams.mockResolvedValue([
      makeTeam({ id: "team-1", ownerId: "other-user" }),
    ]);
    // Never resolves, keeps in-flight state
    mockLeaveTeam.mockReturnValue(new Promise(() => {}));

    const { findByText } = await renderAsync(<JoinTeamScreen />);
    const leaveButton = await findByText("more.joinTeam.leave");

    fireEvent.press(leaveButton);

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons: { onPress?: () => void }[] = alertCall[2];
    const confirmButton = buttons.find((b) => b.onPress !== undefined);

    await act(async () => {
      confirmButton?.onPress?.();
    });

    await waitFor(() => {
      expect(
        leaveButton.parent?.parent?.props.accessibilityState?.disabled,
      ).toBe(true);
    });
  });
});

describe("JoinTeamScreen: Join form input validation", () => {
  it("submit button is disabled when code is empty", async () => {
    const { findByText } = await renderAsync(<JoinTeamScreen />);

    const submitButton = await findByText("more.joinTeam.submit");
    expect(
      submitButton.parent?.parent?.props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it("submit button is disabled when code has 5 characters", async () => {
    const { getByTestId, findByText } = await renderAsync(<JoinTeamScreen />);

    const input = getByTestId("invite-code-input");
    fireEvent.changeText(input, "ABCDE");

    const submitButton = await findByText("more.joinTeam.submit");
    expect(
      submitButton.parent?.parent?.props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it("submit button is enabled when code has exactly 6 characters", async () => {
    const { getByTestId, findByText } = await renderAsync(<JoinTeamScreen />);

    const input = getByTestId("invite-code-input");
    fireEvent.changeText(input, "ABCDEF");

    const submitButton = await findByText("more.joinTeam.submit");
    expect(
      submitButton.parent?.parent?.props.accessibilityState?.disabled,
    ).toBe(false);
  });
});

describe("JoinTeamScreen: Join form submission", () => {
  it("calls acceptInvitation with the uppercased input value", async () => {
    mockAcceptInvitation.mockResolvedValue({
      teamId: "team-new",
      teamName: "Champions",
    });
    mockGetUserTeams.mockResolvedValue([]);

    const { getByTestId, findByText } = await renderAsync(<JoinTeamScreen />);

    fireEvent.changeText(getByTestId("invite-code-input"), "abcdef");

    await act(async () => {
      fireEvent.press(await findByText("more.joinTeam.submit"));
    });

    expect(mockAcceptInvitation).toHaveBeenCalledWith("ABCDEF");
  });

  it("shows success message with team name after successful join", async () => {
    mockAcceptInvitation.mockResolvedValue({
      teamId: "team-new",
      teamName: "Champions",
    });

    const { getByTestId, findByText } = await renderAsync(<JoinTeamScreen />);

    fireEvent.changeText(getByTestId("invite-code-input"), "abc123");

    await act(async () => {
      fireEvent.press(await findByText("more.joinTeam.submit"));
    });

    expect(
      await findByText("more.joinTeam.successMessage:Champions"),
    ).toBeTruthy();
  });

  it("adds newly joined team to the teams list after successful join", async () => {
    mockAcceptInvitation.mockResolvedValue({
      teamId: "team-new",
      teamName: "Champions",
    });
    mockGetUserTeams.mockResolvedValue([]);

    const { getByTestId, findByText } = await renderAsync(<JoinTeamScreen />);

    fireEvent.changeText(getByTestId("invite-code-input"), "abc123");

    await act(async () => {
      fireEvent.press(await findByText("more.joinTeam.submit"));
    });

    expect(await findByText("Champions")).toBeTruthy();
  });

  it("clears input after successful join", async () => {
    mockAcceptInvitation.mockResolvedValue({
      teamId: "team-new",
      teamName: "Champions",
    });

    const { getByTestId, findByText } = await renderAsync(<JoinTeamScreen />);
    const input = getByTestId("invite-code-input");

    fireEvent.changeText(input, "abc123");

    await act(async () => {
      fireEvent.press(await findByText("more.joinTeam.submit"));
    });

    await waitFor(() => {
      expect(input.props.value).toBe("");
    });
  });

  it("shows error key more.joinTeam.errorInvalidCode when acceptInvitation throws with that key", async () => {
    mockAcceptInvitation.mockRejectedValue(
      new Error("more.joinTeam.errorInvalidCode"),
    );

    const { getByTestId, findByText } = await renderAsync(<JoinTeamScreen />);

    fireEvent.changeText(getByTestId("invite-code-input"), "bad123");

    await act(async () => {
      fireEvent.press(await findByText("more.joinTeam.submit"));
    });

    expect(await findByText("more.joinTeam.errorInvalidCode")).toBeTruthy();
  });

  it("shows error key more.joinTeam.errorGeneric for generic errors", async () => {
    mockAcceptInvitation.mockRejectedValue(
      new Error("more.joinTeam.errorGeneric"),
    );

    const { getByTestId, findByText } = await renderAsync(<JoinTeamScreen />);

    fireEvent.changeText(getByTestId("invite-code-input"), "gen123");

    await act(async () => {
      fireEvent.press(await findByText("more.joinTeam.submit"));
    });

    expect(await findByText("more.joinTeam.errorGeneric")).toBeTruthy();
  });

  it("disables submit button while join request is in flight", async () => {
    // Never resolves, keeps loading state
    mockAcceptInvitation.mockReturnValue(new Promise(() => {}));

    const { getByTestId, findByText } = await renderAsync(<JoinTeamScreen />);

    fireEvent.changeText(getByTestId("invite-code-input"), "ABCDEF");

    const submitButton = await findByText("more.joinTeam.submit");

    await act(async () => {
      fireEvent.press(submitButton);
    });

    await waitFor(() => {
      expect(
        submitButton.parent?.parent?.props.accessibilityState?.disabled,
      ).toBe(true);
    });
  });
});
