import i18n from "@/i18n";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { useSportTestsStore } from "@/store/sportTestsStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { formatDateForDisplay, formatDateToISO } from "@/utils/date";
import { Platform } from "react-native";
import { act, fireEvent, render, within } from "../../utils/testUtils";
import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import { type SportTest, type SportTestTranslations } from "./models/SportTest";
import PerformanceTestDetailScreen from "./PerformanceTestDetailScreen";
import {
  BIRTHDAY_AT_14,
  FROZEN_NOW,
} from "@test/factories/performanceTestClock";
import { generatePerformanceTestValue } from "@test/factories/performanceTestValue";
import {
  generateReferenceValue,
  generateSportTest,
} from "@test/factories/sportTest";

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

/** The translations of the 5 m sprint in English and German, the German one with a unit. */
const SPRINT_TRANSLATIONS: SportTestTranslations = {
  en: { name: "5 m sprint" },
  de: { name: "5-m-Sprint", unit: "Sek." },
};

/**
 * A sprint test with the range 9.87 to 6.54 s for the female wing athlete, e.g.
 * { id: "id-SPRINT_5M", code: "SPRINT_5M", unit: "s", referenceValues: [{ ..., rangeStart: 9.87, rangeEnd: 6.54 }] }
 */
const generateSprintTestWithRange = (
  translations: SportTestTranslations = SPRINT_TRANSLATIONS,
): SportTest =>
  generateSportTest("SPRINT_5M", [generateReferenceValue()], translations);

/**
 * A sprint test with the range 11.5 to 9.5 s for ages 11 to 12 and 9.87 to 6.54 s for ages 13 to 14
 * for the female wing athlete, e.g. a value of 10.2 s is in range in the first and below range in the second.
 */
const generateSprintTestWithTwoAgeRanges = (): SportTest =>
  generateSportTest(
    "SPRINT_5M",
    [
      generateReferenceValue({
        trainingStage: "BASISTRAINING",
        minAge: 11,
        maxAge: 12,
        rangeStart: 11.5,
        rangeEnd: 9.5,
      }),
      generateReferenceValue(),
    ],
    SPRINT_TRANSLATIONS,
  );

const seedSportTest = (test: SportTest) => {
  useSportTestsStore.setState({ testsBySport: { SPORT_HANDBALL: [test] } });
  mockFetchSportTests.mockResolvedValue([test]);
};

const seedValues = (values: PerformanceTestValue[]) => {
  usePerformanceTestValuesStore.setState({ values });
};

beforeEach(() => {
  jest.useFakeTimers({ now: FROZEN_NOW });
  mockTestCode = "SPRINT_5M";
  mockFetchSportTests.mockReset();
  useSportTestsStore.setState({ testsBySport: {} });
  usePerformanceTestValuesStore.setState({ values: [] });
  useUserProfileStore.getState().setPersonalData({
    gender: "FEMALE",
    birthday: BIRTHDAY_AT_14,
    weight: undefined,
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

describe("PerformanceTestDetailScreen: translations", () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage("en"));
  });

  it("shows the name in German as heading for a German athlete", async () => {
    await act(() => i18n.changeLanguage("de"));
    mockTestCode = "FAKE_TEST_A";
    seedSportTest(
      generateSportTest("FAKE_TEST_A", [generateReferenceValue()], {
        en: { name: "Fake test" },
        de: { name: "Fake-Test" },
      }),
    );

    const screen = await render(<PerformanceTestDetailScreen />);

    expect(screen.getByRole("header", { name: "Fake-Test" })).toBeTruthy();
  });

  it("shows the English name as heading when the test has no German translation", async () => {
    await act(() => i18n.changeLanguage("de"));
    seedSportTest(generateSprintTestWithRange({ en: { name: "5 m sprint" } }));

    const screen = await render(<PerformanceTestDetailScreen />);

    expect(screen.getByRole("header", { name: "5 m sprint" })).toBeTruthy();
  });

  it("shows the code as heading for a test without translations", async () => {
    seedSportTest(generateSprintTestWithRange({}));

    const screen = await render(<PerformanceTestDetailScreen />);

    expect(screen.getByRole("header", { name: "SPRINT_5M" })).toBeTruthy();
  });

  it("shows the translated unit in the reference line", async () => {
    await act(() => i18n.changeLanguage("de"));

    const screen = await render(<PerformanceTestDetailScreen />);

    expect(screen.getByText("Referenz 9,87 bis 6,54 Sek.")).toBeTruthy();
  });

  it("shows the translated unit behind the latest value in the summary", async () => {
    await act(() => i18n.changeLanguage("de"));
    seedValues([
      generatePerformanceTestValue({
        id: "id-new",
        date: "2026-11-12",
        value: 8.1,
      }),
    ]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const summary = screen.getByTestId("performance-test-summary");
    expect(within(summary).getByText("8,1 Sek.")).toBeTruthy();
  });

  it("shows the translated unit behind the values in the history", async () => {
    await act(() => i18n.changeLanguage("de"));
    seedValues([
      generatePerformanceTestValue({
        id: "id-new",
        date: "2026-11-12",
        value: 8.1,
      }),
    ]);

    const screen = await render(<PerformanceTestDetailScreen />);

    const row = screen.getByTestId("performance-test-value-0");
    expect(within(row).getByText("8,1 Sek.")).toBeTruthy();
  });

  it("shows the translated unit behind the value field and in its label", async () => {
    await act(() => i18n.changeLanguage("de"));

    const screen = await render(<PerformanceTestDetailScreen />);

    expect(
      await screen.findByTestId("performance-test-value-input-suffix", {
        includeHiddenElements: true,
      }),
    ).toHaveTextContent("Sek.");
    expect(screen.getByLabelText("Wert in Sek.")).toBeTruthy();
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

    expect(usePerformanceTestValuesStore.getState().values).toEqual([
      {
        id: expect.any(String),
        sport: "SPORT_HANDBALL",
        testCode: "SPRINT_5M",
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
    expect(usePerformanceTestValuesStore.getState().values).toEqual([]);
  });

  it("shows the error and stores nothing for a non numeric input", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "abc",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(screen.getByTestId("performance-test-value-error")).toBeTruthy();
    expect(usePerformanceTestValuesStore.getState().values).toEqual([]);
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
    expect(usePerformanceTestValuesStore.getState().values).toEqual([]);
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

    expect(usePerformanceTestValuesStore.getState().values).toEqual([
      {
        id: expect.any(String),
        sport: "SPORT_HANDBALL",
        testCode: "SPRINT_5M",
        date: "2026-10-20",
        value: 8.1,
      },
    ]);
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

describe("PerformanceTestDetailScreen: athlete moves to the next age range", () => {
  it("rates the latest value and draws one band per age range with the range of its own date", async () => {
    seedSportTest(generateSprintTestWithTwoAgeRanges());
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

/**
 * A squat strength test, recognised by its code, with the unit rel. 1RM, e.g.
 * { id: "id-SQUAT", code: "SQUAT", unit: "rel. 1RM", referenceValues: [], translations: { en: { name: "Squat" } } }
 */
const generateSquatTest = (): SportTest => ({
  ...generateSportTest("SQUAT", [], { en: { name: "Squat" } }),
  unit: "rel. 1RM",
});

describe("PerformanceTestDetailScreen: strength test with a body weight", () => {
  beforeEach(() => {
    mockTestCode = "SQUAT";
    seedSportTest(generateSquatTest());
    useUserProfileStore.getState().setWeight(60);
  });

  afterEach(async () => {
    await act(() => i18n.changeLanguage("en"));
  });

  it("shows the body weight from the profile above the weight field", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    expect(
      await screen.findByTestId("performance-test-body-weight"),
    ).toHaveTextContent("Body weight: 60 kg");
  });

  it("asks for the lifted weight in kg", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    expect(
      await screen.findByTestId("performance-test-value-input-suffix", {
        includeHiddenElements: true,
      }),
    ).toHaveTextContent("kg");
    expect(screen.getByLabelText("Weight lifted in kg")).toBeTruthy();
  });

  it("stores the lifted weight divided by the body weight", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "90",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(usePerformanceTestValuesStore.getState().values).toEqual([
      {
        id: expect.any(String),
        sport: "SPORT_HANDBALL",
        testCode: "SQUAT",
        date: formatDateToISO(FROZEN_NOW),
        value: 1.5,
      },
    ]);
  });

  it("lists the calculated value with the unit of the test", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "90",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    const row = screen.getByTestId("performance-test-value-0");
    expect(within(row).getByText("1.5 rel. 1RM")).toBeTruthy();
  });

  it("shows the error and stores nothing for an invalid weight", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "abc",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(screen.getByTestId("performance-test-value-error")).toBeTruthy();
    expect(usePerformanceTestValuesStore.getState().values).toEqual([]);
  });

  it("leaves the profile weight unchanged", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "90",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(useUserProfileStore.getState().personalData.weight).toBe(60);
  });

  it("shows the body weight in German", async () => {
    await act(() => i18n.changeLanguage("de"));

    const screen = await render(<PerformanceTestDetailScreen />);

    expect(
      await screen.findByTestId("performance-test-body-weight"),
    ).toHaveTextContent("Körpergewicht: 60 kg");
    expect(screen.getByLabelText("Bewegtes Gewicht in kg")).toBeTruthy();
  });
});

describe("PerformanceTestDetailScreen: strength test entry switch", () => {
  beforeEach(() => {
    mockTestCode = "SQUAT";
    seedSportTest(generateSquatTest());
    useUserProfileStore.getState().setWeight(60);
  });

  it("offers the weight lifted and the value in the test unit, the weight lifted selected", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    expect(
      await screen.findByRole("tab", { name: "Weight lifted" }),
    ).toBeSelected();
    expect(screen.getByRole("tab", { name: "rel. 1RM" })).not.toBeSelected();
  });

  it("asks for the value in the test unit without the body weight after switching", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.press(await screen.findByRole("tab", { name: "rel. 1RM" }));

    expect(screen.getByLabelText("Value in rel. 1RM")).toBeTruthy();
    expect(screen.queryByTestId("performance-test-body-weight")).toBeNull();
  });

  it("stores the entered value as it is after switching", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.press(await screen.findByRole("tab", { name: "rel. 1RM" }));
    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "1,5",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(usePerformanceTestValuesStore.getState().values).toEqual([
      expect.objectContaining({ testCode: "SQUAT", value: 1.5 }),
    ]);
  });

  it("shows the body weight again after switching back", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.press(await screen.findByRole("tab", { name: "rel. 1RM" }));
    await fireEvent.press(screen.getByRole("tab", { name: "Weight lifted" }));

    expect(screen.getByTestId("performance-test-body-weight")).toBeTruthy();
    expect(screen.getByLabelText("Weight lifted in kg")).toBeTruthy();
  });

  it("clears the input when switching", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      await screen.findByTestId("performance-test-value-input"),
      "90",
    );
    await fireEvent.press(screen.getByRole("tab", { name: "rel. 1RM" }));

    expect(screen.getByTestId("performance-test-value-input")).toHaveProp(
      "value",
      "",
    );
  });
});

describe("PerformanceTestDetailScreen: strength test without a body weight", () => {
  beforeEach(() => {
    mockTestCode = "SQUAT";
    seedSportTest(generateSquatTest());
  });

  it("shows no body weight and asks for the value in the test unit", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    expect(await screen.findByLabelText("Value in rel. 1RM")).toBeTruthy();
    expect(screen.queryByTestId("performance-test-body-weight")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("stores the entered value as it is", async () => {
    const screen = await render(<PerformanceTestDetailScreen />);

    await fireEvent.changeText(
      screen.getByTestId("performance-test-value-input"),
      "1,5",
    );
    await fireEvent.press(screen.getByTestId("performance-test-save"));

    expect(usePerformanceTestValuesStore.getState().values).toEqual([
      expect.objectContaining({ testCode: "SQUAT", value: 1.5 }),
    ]);
  });
});

describe("PerformanceTestDetailScreen: other test with a body weight", () => {
  it("shows no body weight for a sprint test", async () => {
    useUserProfileStore.getState().setWeight(60);

    const screen = await render(<PerformanceTestDetailScreen />);

    expect(await screen.findByLabelText("Value in s")).toBeTruthy();
    expect(screen.queryByTestId("performance-test-body-weight")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
  });
});
