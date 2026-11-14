import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { useSportTestsStore } from "@/store/sportTestsStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { formatDateForDisplay, formatDateToISO } from "@/utils/date";
import { Platform } from "react-native";
import { fireEvent, render, within } from "../../utils/testUtils";
import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import { type SportTest } from "./models/SportTest";
import PerformanceTestDetailScreen from "./PerformanceTestDetailScreen";
import {
  BIRTHDAY_AT_14,
  FROZEN_NOW,
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
 * A sprint test with the range 9.87 to 6.54 s for the female wing athlete, e.g.
 * { id: "id-SPRINT_5M", code: "SPRINT_5M", unit: "s", referenceValues: [{ ..., rangeStart: 9.87, rangeEnd: 6.54 }] }
 */
const generateSprintTestWithRange = (): SportTest =>
  generateSportTest("SPRINT_5M", [generateReferenceValue()]);

/**
 * A sprint test with the range 11.5 to 9.5 s in Basistraining and 9.87 to 6.54 s in Grundlagentraining
 * for the female wing athlete, e.g. a value of 10.2 s is in range in the first and below range in the second.
 */
const generateSprintTestWithTwoStages = (): SportTest =>
  generateSportTest("SPRINT_5M", [
    generateReferenceValue({
      trainingStage: "BASISTRAINING",
      rangeStart: 11.5,
      rangeEnd: 9.5,
    }),
    generateReferenceValue(),
  ]);

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
  jest.useFakeTimers({ now: FROZEN_NOW });
  mockTestCode = "SPRINT_5M";
  mockFetchSportTests.mockReset();
  useSportTestsStore.setState({ testsBySport: {} });
  usePerformanceTestValuesStore.setState({ valuesByTest: {} });
  useUserProfileStore.getState().setPersonalData({
    gender: "FEMALE",
    birthday: BIRTHDAY_AT_14,
  });
  useUserWorkoutStore.getState().setSport("SPORT_HANDBALL");
  useUserWorkoutStore
    .getState()
    .setTags({ POSITION: ["WING"], LEVEL: ["BEGINNER"] });
  seedSportTest(generateSprintTestWithRange());
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
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
      generatePerformanceTestValue({
        id: "id-old",
        date: "2026-11-10",
        value: 10.2,
      }),
      generatePerformanceTestValue({
        id: "id-new",
        date: "2026-11-12",
        value: 8.1,
      }),
    ]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const summary = screen.getByTestId("performance-test-summary");
    expect(within(summary).getByText("8.1 s")).toBeTruthy();
    expect(within(summary).getByText("in range")).toBeTruthy();
  });

  it("shows below range for a value before the range start", async () => {
    seedValues([
      generatePerformanceTestValue({
        id: "id-slow",
        date: "2026-11-12",
        value: 10.2,
      }),
    ]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const summary = screen.getByTestId("performance-test-summary");
    expect(within(summary).getByText("below range")).toBeTruthy();
  });

  it("shows above range for a value beyond the range end", async () => {
    seedValues([
      generatePerformanceTestValue({
        id: "id-fast",
        date: "2026-11-12",
        value: 6.1,
      }),
    ]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const summary = screen.getByTestId("performance-test-summary");
    expect(within(summary).getByText("above range")).toBeTruthy();
  });

  it("shows the values without any status when the test has no range for the athlete", async () => {
    seedSportTest(generateSportTest("SPRINT_5M", []));
    seedValues([
      generatePerformanceTestValue({
        id: "id-new",
        date: "2026-11-12",
        value: 8.1,
      }),
    ]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const summary = screen.getByTestId("performance-test-summary");
    expect(within(summary).getByText("8.1 s")).toBeTruthy();
    expect(screen.queryByText(/in range|below range|above range/)).toBeNull();
  });
});

describe("PerformanceTestDetailScreen: chart and hint", () => {
  it("shows the chart when there are values", async () => {
    seedValues([
      generatePerformanceTestValue({
        id: "id-new",
        date: "2026-11-12",
        value: 8.1,
      }),
    ]);

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
  it("stores 8.1 with the date of the frozen today for the input 8,1", async () => {
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
        date: formatDateToISO(FROZEN_NOW),
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

describe("PerformanceTestDetailScreen: entry rules", () => {
  it("shows the error and stores nothing for a negative input", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "-8,1",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(screen.getByTestId("performance-test-value-error")).toBeTruthy();
    expect(
      usePerformanceTestValuesStore.getState().valuesByTest[VALUES_KEY],
    ).toBeUndefined();
  });

  it("stores the chosen date instead of today", async () => {
    jest
      .spyOn(Platform, "select")
      .mockImplementation((spec) => ("web" in spec ? spec.web : undefined));
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent(screen.getByLabelText("Date"), "change", {
      target: { value: "2026-10-20" },
    });
    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "8,1",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(
      usePerformanceTestValuesStore.getState().valuesByTest[VALUES_KEY],
    ).toEqual([{ id: expect.any(String), date: "2026-10-20", value: 8.1 }]);
  });

  it("removes the error text after a valid save", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);
    await fireEvent.press(screen.getByTestId("performance-test-save"));
    expect(screen.getByTestId("performance-test-value-error")).toBeTruthy();

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "8,1",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(screen.queryByTestId("performance-test-value-error")).toBeNull();
  });
});

describe("PerformanceTestDetailScreen: athlete changes the training stage", () => {
  it("rates the latest value and draws one band per stage with the range of its own date", async () => {
    seedSportTest(generateSprintTestWithTwoStages());
    seedValues([
      generatePerformanceTestValue({
        id: "id-basis",
        date: "2025-10-01",
        value: 10.2,
      }),
      generatePerformanceTestValue({
        id: "id-grund",
        date: "2026-11-10",
        value: 10.2,
      }),
    ]);

    const screen = await render(<PerformanceTestDetailScreen />);
    await fireEvent(screen.getByTestId("performance-test-chart"), "layout", {
      nativeEvent: { layout: { width: 320 } },
    });

    const summary = screen.getByTestId("performance-test-summary");
    expect(within(summary).getByText("below range")).toBeTruthy();
    expect(screen.getAllByTestId("performance-test-chart-band")).toHaveLength(
      2,
    );
  });
});

describe("PerformanceTestDetailScreen: history", () => {
  it("lists the values newest first with their dates", async () => {
    seedValues([
      generatePerformanceTestValue({
        id: "id-middle",
        date: "2026-11-11",
        value: 10.2,
      }),
      generatePerformanceTestValue({
        id: "id-newest",
        date: "2026-11-13",
        value: 6.1,
      }),
      generatePerformanceTestValue({
        id: "id-oldest",
        date: "2026-11-09",
        value: 8.1,
      }),
    ]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const newest = screen.getByTestId("performance-test-value-0");
    expect(within(newest).getByText("6.1 s")).toBeTruthy();
    expect(
      within(newest).getByText(formatDateForDisplay("2026-11-13")),
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
  it("shows the not found text for an unknown test code", async () => {
    mockTestCode = "FAKE_UNKNOWN_TEST";

    const screen = await render(<PerformanceTestDetailScreen />);

    expect(
      await screen.findByText("This performance test does not exist."),
    ).toBeTruthy();
    expect(
      screen.queryByText("There are no performance tests for your sport yet."),
    ).toBeNull();
  });
});

describe("PerformanceTestDetailScreen: value field", () => {
  it("shows the unit of the test behind the value field", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    expect(
      await screen.findByTestId("performance-test-value-input-suffix", {
        includeHiddenElements: true,
      }),
    ).toHaveTextContent("s");
    expect(screen.getByLabelText("Value in s")).toBeTruthy();
  });
});
