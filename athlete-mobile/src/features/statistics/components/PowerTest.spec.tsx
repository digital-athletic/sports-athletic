import { WorkoutConstants } from "@/constants/workoutConstants";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { act, fireEvent, render, within } from "@/utils/testUtils";
import { PowerTest } from "./PowerTest";

const mockAgeGroup = jest.fn();

jest.mock("@/features/anamnesis/useAgeGroup", () => ({
  useAgeGroup: () => mockAgeGroup(),
}));

jest.mock("@/charts/PowerTest", () => ({
  PowerTest: () => null,
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

const DAY = 1000 * 60 * 60 * 24;

/**
 * Builds a strength test result with distinct weights per exercise,
 * e.g. squat 100 kg, deadlift 90 kg, bench press 70 kg, rowing 60 kg, shoulder press 40 kg.
 */
const generateStrengthTestResult = (testAt: number) => ({
  ...DEFAULT_MAX_VALUES,
  testAt,
  kneeDominant: { ...DEFAULT_MAX_VALUES.kneeDominant, barbell: 100 },
  hipHinge: { ...DEFAULT_MAX_VALUES.hipHinge, barbell: 90 },
  horizontalPush: { ...DEFAULT_MAX_VALUES.horizontalPush, barbell: 70 },
  horizontalPull: { ...DEFAULT_MAX_VALUES.horizontalPull, barbell: 60 },
  verticalPush: { ...DEFAULT_MAX_VALUES.verticalPush, barbell: 40 },
});

const FIVE_WEIGHTS = ["100 kg", "90 kg", "70 kg", "60 kg", "40 kg"];

beforeEach(() => {
  mockAgeGroup.mockReturnValue(WorkoutConstants.AGE_GROUPS.ADULT);
});

afterEach(async () => {
  await act(() => {
    useExerciseProgressStore.setState({ testHistory: [] });
  });
});

describe("PowerTest statistics: strength test entries", () => {
  it.each([
    WorkoutConstants.AGE_GROUPS.ADULT,
    WorkoutConstants.AGE_GROUPS.ADOLESCENT,
  ])(
    "offers the test and the manual entry to the age group %s",
    async (age) => {
      mockAgeGroup.mockReturnValue(age);
      const { queryByTestId } = await render(<PowerTest />);

      expect(queryByTestId("power-test-start-button")).not.toBeNull();
      expect(queryByTestId("power-test-manual-input-button")).not.toBeNull();
    },
  );

  it("offers neither the test nor the manual entry to a child", async () => {
    mockAgeGroup.mockReturnValue(WorkoutConstants.AGE_GROUPS.CHILD);
    const { queryByTestId } = await render(<PowerTest />);

    expect(queryByTestId("power-test-start-button")).toBeNull();
    expect(queryByTestId("power-test-manual-input-button")).toBeNull();
  });

  it("hides both buttons on the success screen", async () => {
    const { queryByTestId } = await render(<PowerTest isSuccessScreen />);

    expect(queryByTestId("power-test-start-button")).toBeNull();
    expect(queryByTestId("power-test-manual-input-button")).toBeNull();
  });
});

describe("PowerTest statistics: chart card", () => {
  it("shows the gym hint and no legend without a test result", async () => {
    const { getByText, getByTestId, queryByTestId } = await render(
      <PowerTest />,
    );

    expect(
      getByText("The power test will only take place in the gym."),
    ).toBeTruthy();
    expect(getByTestId("power-test-no-results")).toBeTruthy();
    expect(queryByTestId("power-test-legend")).toBeNull();
  });

  it("shows the legend of all five exercises inside the chart card", async () => {
    await act(() => {
      useExerciseProgressStore.setState({
        testHistory: [generateStrengthTestResult(Date.now() - DAY)],
      });
    });
    const { getByTestId } = await render(<PowerTest />);

    const legend = within(getByTestId("power-test-chart-card")).getByTestId(
      "power-test-legend",
    );
    for (const name of [
      "Squat",
      "Deadlift",
      "Bench press",
      "Rowing",
      "Shoulder press",
    ]) {
      expect(within(legend).getByText(name)).toBeTruthy();
    }
  });
});

describe("PowerTest statistics: test result cards", () => {
  beforeEach(async () => {
    await act(() => {
      useExerciseProgressStore.setState({
        testHistory: [generateStrengthTestResult(Date.now() - DAY)],
      });
    });
  });

  it("labels the results section", async () => {
    const { getByText } = await render(<PowerTest />);

    expect(getByText("Your test results")).toBeTruthy();
  });

  it("expands a result card to the five weights and collapses it again", async () => {
    const { getByTestId } = await render(<PowerTest />);
    const entry = getByTestId("power-test-entry-0");

    expect(within(entry).getByRole("button", { expanded: false })).toBeTruthy();
    expect(within(entry).queryByText("100 kg")).toBeNull();

    await fireEvent.press(within(entry).getByRole("button"));

    expect(within(entry).getByRole("button", { expanded: true })).toBeTruthy();
    for (const weight of FIVE_WEIGHTS) {
      expect(within(entry).getByText(weight)).toBeTruthy();
    }

    await fireEvent.press(within(entry).getByRole("button"));

    expect(within(entry).queryByText("100 kg")).toBeNull();
  });

  it("opens the latest result on the success screen", async () => {
    const { getByTestId } = await render(<PowerTest isSuccessScreen />);

    const entry = getByTestId("power-test-entry-0");
    for (const weight of FIVE_WEIGHTS) {
      expect(within(entry).getByText(weight)).toBeTruthy();
    }
  });
});
