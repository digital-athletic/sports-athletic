import { act, fireEvent, render } from "@testing-library/react-native";
import { type ReactNode } from "react";
import TeamInfoScreen from "./TeamInfoScreen";

const mockGetTeamInfo = jest.fn();
jest.mock("@/services/TeamService", () => ({
  getTeamInfo: (teamId: string) => mockGetTeamInfo(teamId),
}));

// Runs the focus callback on mount like a first focus, and keeps it so a test
// can focus the screen again as when the athlete returns to it.
let mockRefocus: () => void = () => {};
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ teamId: "team-1" }),
  useFocusEffect: (callback: () => void) => {
    mockRefocus = callback;
    require("react").useEffect(callback, [callback]);
  },
  Stack: { Screen: () => null },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count === undefined ? key : `${key}:${opts.count}`,
  }),
}));

jest.mock("@/theme/Box", () => ({
  Box: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/theme/ScrollBox", () => ({
  ScrollBox: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/theme/Text", () => ({
  Text: ({ children, testID }: { children: ReactNode; testID?: string }) => {
    const { Text: RNText } = require("react-native");
    return <RNText testID={testID}>{children}</RNText>;
  },
}));

jest.mock("@/theme/Button", () => ({
  Button: ({
    children,
    onPress,
    testID,
  }: {
    children: ReactNode;
    onPress?: () => void;
    testID?: string;
  }) => {
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

/**
 * Team info as getTeamInfo returns it, e.g.
 * { id: "team-1", name: "U19 Keepers", guidance: "Mon and Thu", weeklyTrainingDays: 3 }
 */
const generateTeamInfo = (
  overrides: Partial<{
    guidance: string | null;
    weeklyTrainingDays: number | null;
  }> = {},
) => ({
  id: "team-1",
  name: "U19 Keepers",
  guidance: "Team sessions Mon and Thu 18:00.",
  weeklyTrainingDays: 3,
  ...overrides,
});

beforeEach(() => {
  mockGetTeamInfo.mockReset();
});

describe("TeamInfoScreen: content", () => {
  it("shows name, guidance and weekly target when both are set", async () => {
    mockGetTeamInfo.mockResolvedValue(generateTeamInfo());

    const screen = await render(<TeamInfoScreen />);

    expect(await screen.findByText("U19 Keepers")).toBeTruthy();
    expect(screen.getByText("Team sessions Mon and Thu 18:00.")).toBeTruthy();
    expect(screen.getByText("more.teamInfo.weeklyTarget:3")).toBeTruthy();
    expect(screen.queryByText("more.teamInfo.noGuidance")).toBeNull();
  });

  it("shows only the guidance when no weekly target is set", async () => {
    mockGetTeamInfo.mockResolvedValue(
      generateTeamInfo({ weeklyTrainingDays: null }),
    );

    const screen = await render(<TeamInfoScreen />);

    expect(
      await screen.findByText("Team sessions Mon and Thu 18:00."),
    ).toBeTruthy();
    expect(screen.queryByTestId("team-info-weekly-target")).toBeNull();
    expect(screen.queryByText("more.teamInfo.noGuidance")).toBeNull();
  });

  it("shows only the weekly target when no guidance is set", async () => {
    mockGetTeamInfo.mockResolvedValue(generateTeamInfo({ guidance: null }));

    const screen = await render(<TeamInfoScreen />);

    expect(
      await screen.findByText("more.teamInfo.weeklyTarget:3"),
    ).toBeTruthy();
    expect(screen.queryByTestId("team-info-guidance")).toBeNull();
    expect(screen.queryByText("more.teamInfo.noGuidance")).toBeNull();
  });

  it("shows the name and a hint when neither is set", async () => {
    mockGetTeamInfo.mockResolvedValue(
      generateTeamInfo({ guidance: null, weeklyTrainingDays: null }),
    );

    const screen = await render(<TeamInfoScreen />);

    expect(await screen.findByText("U19 Keepers")).toBeTruthy();
    expect(screen.getByText("more.teamInfo.noGuidance")).toBeTruthy();
  });

  it("uses the singular form for a target of one day", async () => {
    mockGetTeamInfo.mockResolvedValue(
      generateTeamInfo({ weeklyTrainingDays: 1 }),
    );

    const screen = await render(<TeamInfoScreen />);

    expect(
      await screen.findByText("more.teamInfo.weeklyTarget:1"),
    ).toBeTruthy();
  });
});

describe("TeamInfoScreen: loading", () => {
  it("reads the team by the id from the route", async () => {
    mockGetTeamInfo.mockResolvedValue(generateTeamInfo());

    const screen = await render(<TeamInfoScreen />);
    await screen.findByText("U19 Keepers");

    expect(mockGetTeamInfo).toHaveBeenCalledWith("team-1");
  });

  it("shows a loading indicator while the team loads", async () => {
    mockGetTeamInfo.mockReturnValue(new Promise(() => {}));

    const screen = await render(<TeamInfoScreen />);

    expect(screen.getByTestId("team-info-loading")).toBeTruthy();
  });

  it("loads the current values again when the athlete returns", async () => {
    mockGetTeamInfo.mockResolvedValueOnce(generateTeamInfo());
    mockGetTeamInfo.mockResolvedValueOnce(
      generateTeamInfo({ guidance: "Now only Mondays." }),
    );

    const screen = await render(<TeamInfoScreen />);
    await screen.findByText("Team sessions Mon and Thu 18:00.");

    await act(async () => {
      mockRefocus();
    });

    expect(await screen.findByText("Now only Mondays.")).toBeTruthy();
    expect(mockGetTeamInfo).toHaveBeenCalledTimes(2);
  });
});

describe("TeamInfoScreen: errors", () => {
  it("shows a read error with retry and never the empty guidance hint", async () => {
    mockGetTeamInfo.mockRejectedValue(new Error("more.teamInfo.loadError"));

    const screen = await render(<TeamInfoScreen />);

    expect(await screen.findByText("more.teamInfo.loadError")).toBeTruthy();
    expect(screen.getByTestId("team-info-retry")).toBeTruthy();
    expect(screen.queryByText("more.teamInfo.noGuidance")).toBeNull();
  });

  it("loads again when the athlete taps retry", async () => {
    mockGetTeamInfo.mockRejectedValueOnce(new Error("more.teamInfo.loadError"));
    mockGetTeamInfo.mockResolvedValueOnce(generateTeamInfo());

    const screen = await render(<TeamInfoScreen />);
    await screen.findByTestId("team-info-retry");

    await act(async () => {
      fireEvent.press(screen.getByTestId("team-info-retry"));
    });

    expect(await screen.findByText("U19 Keepers")).toBeTruthy();
  });

  it("tells the athlete when they no longer belong to the team", async () => {
    mockGetTeamInfo.mockResolvedValue(null);

    const screen = await render(<TeamInfoScreen />);

    expect(await screen.findByText("more.teamInfo.notMember")).toBeTruthy();
    expect(screen.queryByText("more.teamInfo.noGuidance")).toBeNull();
    expect(screen.queryByTestId("team-info-retry")).toBeNull();
  });
});
