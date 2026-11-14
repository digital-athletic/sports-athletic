import { type SportTest } from "@/features/performanceTests/models/SportTest";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { useSportTestsStore } from "@/store/sportTestsStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { act, fireEvent, render, within } from "../../utils/testUtils";
import PerformanceTestsScreen from "./PerformanceTestsScreen";
import {
  BIRTHDAY_AT_14,
  FROZEN_NOW,
  generatePerformanceTestValue,
  generateReferenceValue,
  generateSportTest,
} from "./testFixtures";

const mockFetchSportTests = jest.fn();
const mockNavigate = jest.fn();
jest.mock("@/services/SportTestService", () => ({
  fetchSportTests: (sport: string) => mockFetchSportTests(sport),
}));

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ navigate: mockNavigate }),
  useFocusEffect: (callback: () => void) => {
    require("react").useEffect(callback, [callback]);
  },
}));

/**
 * A test with a range for a female wing player in Grundlagentraining, e.g.
 * { id: "id-SPRINT_5M", code: "SPRINT_5M", unit: "s", referenceValues: [{ ..., rangeStart: 9.87, rangeEnd: 6.54 }] }
 */
const generateTestWithRange = (code = "SPRINT_5M"): SportTest =>
  generateSportTest(code, [generateReferenceValue()]);

beforeEach(() => {
  jest.useFakeTimers({ now: FROZEN_NOW });
  mockFetchSportTests.mockReset();
  mockNavigate.mockReset();
  usePerformanceTestValuesStore.setState({ valuesByTest: {} });
  useSportTestsStore.setState({ testsBySport: {} });
  useUserProfileStore.getState().setPersonalData({
    gender: "FEMALE",
    birthday: BIRTHDAY_AT_14,
  });
  useUserWorkoutStore.getState().setSport("SPORT_HANDBALL");
  useUserWorkoutStore
    .getState()
    .setTags({ POSITION: ["WING"], LEVEL: ["BEGINNER"] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("PerformanceTestsScreen: list", () => {
  it("shows the test name and the reference range of the athlete", async () => {
    mockFetchSportTests.mockResolvedValue([generateTestWithRange()]);

    const screen = await render(<PerformanceTestsScreen />);

    expect(await screen.findByText("5 m sprint")).toBeTruthy();
    expect(screen.getByText("Reference 9.87 to 6.54 s")).toBeTruthy();
  });

  it("says there is no reference when no range matches the stage", async () => {
    mockFetchSportTests.mockResolvedValue([
      generateSportTest("FAKE_TEST", [
        generateReferenceValue({ trainingStage: "BASISTRAINING" }),
      ]),
    ]);

    const screen = await render(<PerformanceTestsScreen />);

    expect(
      await screen.findByText("No reference for your training stage"),
    ).toBeTruthy();
    expect(screen.queryByText(/^Reference /)).toBeNull();
  });

  it("shows the code when a test has no translation", async () => {
    mockFetchSportTests.mockResolvedValue([
      generateTestWithRange("FAKE_UNTRANSLATED"),
    ]);

    const screen = await render(<PerformanceTestsScreen />);

    expect(await screen.findByText("FAKE_UNTRANSLATED")).toBeTruthy();
  });

  it("lists one row per test", async () => {
    mockFetchSportTests.mockResolvedValue([
      generateTestWithRange("SPRINT_5M"),
      generateTestWithRange("FAKE_UNTRANSLATED"),
    ]);

    const screen = await render(<PerformanceTestsScreen />);

    expect(
      await screen.findByTestId("performance-test-row-SPRINT_5M"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("performance-test-row-FAKE_UNTRANSLATED"),
    ).toBeTruthy();
  });
});

describe("PerformanceTestsScreen: states", () => {
  it("shows the empty state when the sport has no tests", async () => {
    mockFetchSportTests.mockResolvedValue([]);

    const screen = await render(<PerformanceTestsScreen />);

    expect(await screen.findByTestId("performance-tests-empty")).toBeTruthy();
    expect(
      screen.getByText("There are no performance tests for your sport yet."),
    ).toBeTruthy();
  });

  it("shows a loading indicator while the tests load", async () => {
    mockFetchSportTests.mockReturnValue(new Promise(() => {}));

    const screen = await render(<PerformanceTestsScreen />);

    expect(screen.getByTestId("performance-tests-loading")).toBeTruthy();
  });

  it("shows an error with a retry button when loading fails", async () => {
    mockFetchSportTests.mockRejectedValue(new Error("offline"));

    const screen = await render(<PerformanceTestsScreen />);

    expect(await screen.findByTestId("performance-tests-retry")).toBeTruthy();
    expect(screen.queryByTestId("performance-tests-empty")).toBeNull();
  });

  it("loads again when the athlete taps retry", async () => {
    mockFetchSportTests.mockRejectedValueOnce(new Error("offline"));
    mockFetchSportTests.mockResolvedValueOnce([generateTestWithRange()]);
    const screen = await render(<PerformanceTestsScreen />);
    await screen.findByTestId("performance-tests-retry");

    await act(async () => {
      fireEvent.press(screen.getByTestId("performance-tests-retry"));
    });

    expect(await screen.findByText("5 m sprint")).toBeTruthy();
    expect(mockFetchSportTests).toHaveBeenCalledTimes(2);
  });
});

describe("PerformanceTestsScreen: latest value on the card", () => {
  it("shows the latest value with its unit and status", async () => {
    mockFetchSportTests.mockResolvedValue([generateTestWithRange()]);
    usePerformanceTestValuesStore.setState({
      valuesByTest: {
        "SPORT_HANDBALL/SPRINT_5M": [
          generatePerformanceTestValue({
            id: "id-old",
            date: "2026-02-01",
            value: 10.2,
          }),
          generatePerformanceTestValue({
            id: "id-new",
            date: "2026-03-01",
            value: 8.1,
          }),
        ],
      },
    });

    const screen = await render(<PerformanceTestsScreen />);

    const latest = await screen.findByTestId(
      "performance-test-latest-SPRINT_5M",
    );
    expect(within(latest).getByText("8.1 s")).toBeTruthy();
    expect(within(latest).getByText("in range")).toBeTruthy();
  });

  it("shows No value on a card without values", async () => {
    mockFetchSportTests.mockResolvedValue([generateTestWithRange()]);

    const screen = await render(<PerformanceTestsScreen />);

    const latest = await screen.findByTestId(
      "performance-test-latest-SPRINT_5M",
    );
    expect(within(latest).getByText("No value")).toBeTruthy();
  });
});

describe("PerformanceTestsScreen: open the detail", () => {
  it("navigates to the detail route with the test code when a card is pressed", async () => {
    mockFetchSportTests.mockResolvedValue([generateTestWithRange()]);
    const screen = await render(<PerformanceTestsScreen />);

    await fireEvent.press(
      await screen.findByTestId("performance-test-row-SPRINT_5M"),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/(more)/performance-test/[testCode]",
        params: expect.objectContaining({ testCode: "SPRINT_5M" }),
      }),
    );
  });

  it("announces each card as a button", async () => {
    mockFetchSportTests.mockResolvedValue([generateTestWithRange()]);

    const screen = await render(<PerformanceTestsScreen />);

    expect(
      await screen.findByRole("button", { name: /5 m sprint/ }),
    ).toBeTruthy();
  });
});
