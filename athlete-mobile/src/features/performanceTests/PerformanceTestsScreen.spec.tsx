import { type SportTest } from "@/features/performanceTests/models/SportTest";
import { useSportTestsStore } from "@/store/sportTestsStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { formatDateToISO } from "@/utils/date";
import { act, fireEvent, render } from "../../utils/testUtils";
import PerformanceTestsScreen from "./PerformanceTestsScreen";

const mockFetchSportTests = jest.fn();
jest.mock("@/services/SportTestService", () => ({
  fetchSportTests: (sport: string) => mockFetchSportTests(sport),
}));

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ navigate: jest.fn() }),
  useFocusEffect: (callback: () => void) => {
    require("react").useEffect(callback, [callback]);
  },
}));

/**
 * ISO birthday that makes the athlete exactly the given age today, e.g.
 * on 2026-11-14 and age 14 it returns "2012-11-01".
 */
const generateBirthdayForAge = (age: number): string => {
  const today = new Date();
  return formatDateToISO(
    new Date(today.getFullYear() - age, today.getMonth(), 1),
  );
};

/**
 * Sport test with one female wing reference value, e.g.
 * { id: "id-SPRINT_5M", code: "SPRINT_5M", unit: "s", referenceValues: [{ FEMALE, WING, GRUNDLAGENTRAINING, 9.87 to 6.54 }] }
 */
const generateSprintTest = (code = "SPRINT_5M"): SportTest => ({
  id: `id-${code}`,
  code,
  unit: "s",
  referenceValues: [
    {
      gender: "FEMALE",
      position: "WING",
      trainingStage: "GRUNDLAGENTRAINING",
      rangeStart: 9.87,
      rangeEnd: 6.54,
    },
  ],
});

/**
 * Sport test whose only reference value is for another stage, e.g.
 * { id: "id-FAKE_TEST", code: "FAKE_TEST", unit: "s", referenceValues: [{ FEMALE, WING, BASISTRAINING, 5.1 to 5.2 }] }
 */
const generateTestWithoutMatchingRange = (): SportTest => ({
  id: "id-FAKE_TEST",
  code: "FAKE_TEST",
  unit: "s",
  referenceValues: [
    {
      gender: "FEMALE",
      position: "WING",
      trainingStage: "BASISTRAINING",
      rangeStart: 5.1,
      rangeEnd: 5.2,
    },
  ],
});

beforeEach(() => {
  mockFetchSportTests.mockReset();
  useSportTestsStore.setState({ testsBySport: {} });
  useUserProfileStore.getState().setPersonalData({
    gender: "FEMALE",
    birthday: generateBirthdayForAge(14),
  });
  useUserWorkoutStore.getState().setSport("HANDBALL_SPORT");
  useUserWorkoutStore
    .getState()
    .setTags({ POSITION: ["WING"], LEVEL: ["BEGINNER"] });
});

describe("PerformanceTestsScreen: list", () => {
  it("shows the test name and the reference range of the athlete", async () => {
    mockFetchSportTests.mockResolvedValue([generateSprintTest()]);

    const screen = await render(<PerformanceTestsScreen />);

    expect(await screen.findByText("5 m sprint")).toBeTruthy();
    expect(screen.getByText("Reference 9.87 to 6.54 s")).toBeTruthy();
  });

  it("asks for the tests of the sport of the athlete", async () => {
    mockFetchSportTests.mockResolvedValue([generateSprintTest()]);

    const screen = await render(<PerformanceTestsScreen />);
    await screen.findByText("5 m sprint");

    expect(mockFetchSportTests).toHaveBeenCalledWith("HANDBALL_SPORT");
  });

  it("says there is no reference when no range matches the stage", async () => {
    mockFetchSportTests.mockResolvedValue([generateTestWithoutMatchingRange()]);

    const screen = await render(<PerformanceTestsScreen />);

    expect(
      await screen.findByText("No reference for your training stage"),
    ).toBeTruthy();
    expect(screen.queryByText(/^Reference /)).toBeNull();
  });

  it("shows the code when a test has no translation", async () => {
    mockFetchSportTests.mockResolvedValue([
      generateSprintTest("FAKE_UNTRANSLATED"),
    ]);

    const screen = await render(<PerformanceTestsScreen />);

    expect(await screen.findByText("FAKE_UNTRANSLATED")).toBeTruthy();
  });

  it("lists one row per test", async () => {
    mockFetchSportTests.mockResolvedValue([
      generateSprintTest("SPRINT_5M"),
      generateSprintTest("FAKE_UNTRANSLATED"),
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
    mockFetchSportTests.mockResolvedValueOnce([generateSprintTest()]);
    const screen = await render(<PerformanceTestsScreen />);
    await screen.findByTestId("performance-tests-retry");

    await act(async () => {
      fireEvent.press(screen.getByTestId("performance-tests-retry"));
    });

    expect(await screen.findByText("5 m sprint")).toBeTruthy();
    expect(mockFetchSportTests).toHaveBeenCalledTimes(2);
  });
});
