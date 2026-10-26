import i18n from "@/i18n";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { UserExerciseDataType } from "@/schemas/sync.schema";
import { useAuthStore } from "@/store/authStore";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { act, fireEvent, render, within } from "@/utils/testUtils";
import { StatisticsScreen } from "./StatisticsScreen";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/charts/PowerTest", () => ({ PowerTest: () => null }));
jest.mock("@/charts/RadarChart", () => ({ RadarChart: () => null }));

const DAY = 1000 * 60 * 60 * 24;
const SCALES = ["week", "month", "year", "total"] as const;
const scaleLabel = (scale: (typeof SCALES)[number]): string =>
  i18n.t(`statistics.workouts.scales.${scale}`);

const PERFORMED_SET: UserExerciseDataType = {
  exerciseId: "342",
  skill: "SWR1",
  set: [1, 1],
  repetition: 8,
  completed: true,
};

const seedData = async (): Promise<void> => {
  await act(() => {
    useAuthStore.setState({ auth: { userId: "u1" } });
    const workouts = useCompletedWorkoutsStore.getState();
    workouts.clearWorkoutHistory();
    workouts.addCompletedWorkout({
      id: "old",
      timestamp: Date.now() - 60 * DAY,
      exercises: [PERFORMED_SET],
      duration: 600,
      exerciseCount: 3,
    });
    workouts.addCompletedWorkout({
      id: "recent",
      timestamp: Date.now() - DAY,
      exercises: [PERFORMED_SET],
      duration: 600,
      exerciseCount: 5,
    });
    useExerciseProgressStore.setState({
      testHistory: [
        { ...DEFAULT_MAX_VALUES, testAt: Date.now() - 60 * DAY },
        { ...DEFAULT_MAX_VALUES, testAt: Date.now() - DAY },
      ],
    });
  });
};

describe("StatisticsScreen: range selector", () => {
  beforeEach(seedData);

  afterEach(async () => {
    await act(() => {
      useAuthStore.setState({ auth: null });
      useCompletedWorkoutsStore.getState().clearWorkoutHistory();
      useExerciseProgressStore.setState({ testHistory: [] });
    });
  });

  it("shows the range buttons on both sub tabs", async () => {
    const { getByLabelText, getByTestId } = await render(<StatisticsScreen />);

    for (const scale of SCALES) {
      expect(getByLabelText(scaleLabel(scale))).toBeTruthy();
    }

    await fireEvent.press(getByTestId("statistics-tab-tests"));

    for (const scale of SCALES) {
      expect(getByLabelText(scaleLabel(scale))).toBeTruthy();
    }
  });

  it("filters the workout summary by the selected range", async () => {
    const { getByLabelText, getByTestId } = await render(<StatisticsScreen />);
    const summary = () => within(getByTestId("overall-summary"));

    expect(summary().queryByText("8")).not.toBeNull();

    await fireEvent.press(getByLabelText(scaleLabel("week")));

    expect(summary().queryByText("5")).not.toBeNull();
    expect(summary().queryByText("8")).toBeNull();
  });

  it("keeps the selected range across sub tab switches and filters strength tests", async () => {
    const { getByLabelText, getByTestId, queryByTestId } = await render(
      <StatisticsScreen />,
    );

    await fireEvent.press(getByLabelText(scaleLabel("week")));
    await fireEvent.press(getByTestId("statistics-tab-tests"));

    expect(queryByTestId("power-test-entry-0")).not.toBeNull();
    expect(queryByTestId("power-test-entry-1")).toBeNull();

    await fireEvent.press(getByTestId("statistics-tab-workouts"));

    expect(
      within(getByTestId("overall-summary")).queryByText("5"),
    ).not.toBeNull();

    await fireEvent.press(getByLabelText(scaleLabel("total")));
    await fireEvent.press(getByTestId("statistics-tab-tests"));

    expect(queryByTestId("power-test-entry-1")).not.toBeNull();
  });
});

describe("StatisticsScreen: export button", () => {
  afterEach(async () => {
    await act(() => {
      useAuthStore.setState({ auth: null });
      useCompletedWorkoutsStore.getState().clearWorkoutHistory();
      useExerciseProgressStore.setState({ testHistory: [] });
    });
  });

  it("is present and disabled with empty stores", async () => {
    await act(() => {
      useAuthStore.setState({ auth: { userId: "u1" } });
      useCompletedWorkoutsStore.getState().clearWorkoutHistory();
      useExerciseProgressStore.setState({ testHistory: [] });
    });
    const { getByTestId } = await render(<StatisticsScreen />);

    const button = getByTestId("statistics-export-button");
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    expect(button.props.accessibilityLabel).toBe(
      i18n.t("statistics.export.label"),
    );
  });

  it("is enabled when the workouts range holds rows", async () => {
    await seedData();
    const { getByTestId } = await render(<StatisticsScreen />);

    expect(
      getByTestId("statistics-export-button").props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });

  it("follows the active sub tab and the range", async () => {
    await seedData();
    await act(() => {
      useCompletedWorkoutsStore.getState().clearWorkoutHistory();
    });
    const { getByTestId, getByLabelText } = await render(<StatisticsScreen />);

    expect(
      getByTestId("statistics-export-button").props.accessibilityState,
    ).toMatchObject({ disabled: true });

    await fireEvent.press(getByTestId("statistics-tab-tests"));

    expect(
      getByTestId("statistics-export-button").props.accessibilityState,
    ).toMatchObject({ disabled: false });

    await act(() => {
      useExerciseProgressStore.setState({
        testHistory: [{ ...DEFAULT_MAX_VALUES, testAt: Date.now() - 60 * DAY }],
      });
    });
    await fireEvent.press(getByLabelText(scaleLabel("week")));

    expect(
      getByTestId("statistics-export-button").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });
});
