import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { useSportTestsStore } from "@/store/sportTestsStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { addDays, formatDateForDisplay, formatDateToISO } from "@/utils/date";
import { fireEvent, render, within } from "../../utils/testUtils";
import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import { type SportTest } from "./models/SportTest";
import PerformanceTestDetailScreen from "./PerformanceTestDetailScreen";
import {
  generateBirthdayForAge,
  generatePerformanceTestValue,
  generateReferenceValue,
  generateSportTest,
} from "./testFixtures";

const mockFetchSportTests = jest.fn();
jest.mock("@/services/SportTestService", () => ({
  fetchSportTests: (sport: string) => mockFetchSportTests(sport),
}));

let mockTestCode = "SPRINT_5M";
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ navigate: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ testCode: mockTestCode }),
  useFocusEffect: (callback: () => void) => {
    require("react").useEffect(callback, [callback]);
  },
}));

const VALUES_KEY = "SPORT_HANDBALL/SPRINT_5M";

/**
 * ISO date some days before today, e.g. on 2026-11-14 and 3 days it returns "2026-11-11".
 * The athlete of this spec turns 14 on the 1st of the current month, so up to 5 days back she is in Grundlagentraining.
 */
const generateDateDaysAgo = (days: number): string =>
  formatDateToISO(addDays(new Date(), -days));

/**
 * A value of the test entered some days ago, e.g. generateValueDaysAgo("id-a", 3, 8.1) returns
 * { id: "id-a", date: "2026-11-11", value: 8.1 }
 */
const generateValueDaysAgo = (
  id: string,
  days: number,
  value: number,
): PerformanceTestValue =>
  generatePerformanceTestValue({ id, date: generateDateDaysAgo(days), value });

/**
 * A sprint test with the range 9.87 to 6.54 s for the female wing athlete, e.g.
 * { id: "id-SPRINT_5M", code: "SPRINT_5M", unit: "s", referenceValues: [{ ..., rangeStart: 9.87, rangeEnd: 6.54 }] }
 */
const generateSprintTestWithRange = (): SportTest =>
  generateSportTest("SPRINT_5M", [generateReferenceValue()]);

const seedSportTest = (test: SportTest) => {
  useSportTestsStore.setState({ testsBySport: { SPORT_HANDBALL: [test] } });
  mockFetchSportTests.mockResolvedValue([test]);
};

const seedValues = (values: PerformanceTestValue[]) => {
  usePerformanceTestValuesStore.setState({
    valuesByTest: { [VALUES_KEY]: values },
  });
};

beforeEach(() => {
  mockTestCode = "SPRINT_5M";
  mockFetchSportTests.mockReset();
  useSportTestsStore.setState({ testsBySport: {} });
  usePerformanceTestValuesStore.setState({ valuesByTest: {} });
  useUserProfileStore.getState().setPersonalData({
    gender: "FEMALE",
    birthday: generateBirthdayForAge(14),
  });
  useUserWorkoutStore.getState().setSport("SPORT_HANDBALL");
  useUserWorkoutStore
    .getState()
    .setTags({ POSITION: ["WING"], LEVEL: ["BEGINNER"] });
  seedSportTest(generateSprintTestWithRange());
});

describe("PerformanceTestDetailScreen: heading", () => {
  it("shows the test name as heading", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    expect(screen.getByRole("header", { name: "5 m sprint" })).toBeTruthy();
  });

  it("shows the reference line as description", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    expect(screen.getByText("Reference 9.87 to 6.54 s")).toBeTruthy();
  });
});

describe("PerformanceTestDetailScreen: summary", () => {
  it("shows the latest value with the status in range", async () => {
    seedValues([
      generateValueDaysAgo("id-old", 4, 10.2),
      generateValueDaysAgo("id-new", 2, 8.1),
    ]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const summary = screen.getByTestId("performance-test-summary");
    expect(within(summary).getByText("8.1 s")).toBeTruthy();
    expect(within(summary).getByText("in range")).toBeTruthy();
  });

  it("shows below range for a value before the range start", async () => {
    seedValues([generateValueDaysAgo("id-slow", 2, 10.2)]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const summary = screen.getByTestId("performance-test-summary");
    expect(within(summary).getByText("below range")).toBeTruthy();
  });

  it("shows above range for a value beyond the range end", async () => {
    seedValues([generateValueDaysAgo("id-fast", 2, 6.1)]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const summary = screen.getByTestId("performance-test-summary");
    expect(within(summary).getByText("above range")).toBeTruthy();
  });

  it("shows the values without any status when the test has no range for the athlete", async () => {
    seedSportTest(generateSportTest("SPRINT_5M", []));
    seedValues([generateValueDaysAgo("id-new", 2, 8.1)]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const summary = screen.getByTestId("performance-test-summary");
    expect(within(summary).getByText("8.1 s")).toBeTruthy();
    expect(screen.queryByText(/in range|below range|above range/)).toBeNull();
  });
});

describe("PerformanceTestDetailScreen: chart and hint", () => {
  it("shows the chart when there are values", async () => {
    seedValues([generateValueDaysAgo("id-new", 2, 8.1)]);

    const screen = await render(<PerformanceTestDetailScreen />);

    expect(screen.getByTestId("performance-test-chart")).toBeTruthy();
    expect(screen.queryByTestId("performance-test-no-values")).toBeNull();
  });

  it("shows the hint and no chart when there are no values", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    expect(screen.getByTestId("performance-test-no-values")).toBeTruthy();
    expect(screen.queryByTestId("performance-test-chart")).toBeNull();
  });
});

describe("PerformanceTestDetailScreen: add a value", () => {
  it("stores 8.1 with today's date for the input 8,1", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "8,1",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(
      usePerformanceTestValuesStore.getState().valuesByTest[VALUES_KEY],
    ).toEqual([
      {
        id: expect.any(String),
        date: formatDateToISO(new Date()),
        value: 8.1,
      },
    ]);
  });

  it("lists the saved value in the history", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "8,1",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    const row = screen.getByTestId("performance-test-value-0");
    expect(within(row).getByText("8.1 s")).toBeTruthy();
  });

  it("shows the error and stores nothing for an empty input", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(screen.getByTestId("performance-test-value-error")).toBeTruthy();
    expect(
      usePerformanceTestValuesStore.getState().valuesByTest[VALUES_KEY],
    ).toBeUndefined();
  });

  it("shows the error and stores nothing for a non numeric input", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "abc",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(screen.getByTestId("performance-test-value-error")).toBeTruthy();
    expect(
      usePerformanceTestValuesStore.getState().valuesByTest[VALUES_KEY],
    ).toBeUndefined();
  });
});

describe("PerformanceTestDetailScreen: history", () => {
  it("lists the values newest first with their dates", async () => {
    seedValues([
      generateValueDaysAgo("id-middle", 3, 10.2),
      generateValueDaysAgo("id-newest", 1, 6.1),
      generateValueDaysAgo("id-oldest", 5, 8.1),
    ]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const newest = screen.getByTestId("performance-test-value-0");
    expect(within(newest).getByText("6.1 s")).toBeTruthy();
    expect(
      within(newest).getByText(formatDateForDisplay(generateDateDaysAgo(1))),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("performance-test-value-1")).getByText(
        "10.2 s",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("performance-test-value-2")).getByText("8.1 s"),
    ).toBeTruthy();
  });
});

describe("PerformanceTestDetailScreen: unknown test", () => {
  it("shows the empty text for an unknown test code", async () => {
    mockTestCode = "FAKE_UNKNOWN_TEST";

    const screen = await render(<PerformanceTestDetailScreen />);

    expect(
      await screen.findByText(
        "There are no performance tests for your sport yet.",
      ),
    ).toBeTruthy();
  });
});
