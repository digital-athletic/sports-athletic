import { generateSportTest } from "@/features/performanceTests/testFixtures";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { type MaxValuesType } from "@/schemas/user.schema";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import {
  ALL_SPORTS_CACHE_KEY,
  useSportTestsStore,
} from "@/store/sportTestsStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { act, renderHook } from "@testing-library/react-native";
import { useStoreStrengthTestResult } from "./useStoreStrengthTestResult";

/**
 * A strength test result of 2026-11-10 with a squat of 84 kg and a deadlift of 105 kg, e.g.
 * kneeDominant: { barbell: 84 }, hipHinge: { barbell: 105 }.
 */
const generateStrengthTestResult = (): MaxValuesType => ({
  ...DEFAULT_MAX_VALUES,
  testAt: new Date(2026, 10, 10, 12).getTime(),
  kneeDominant: { barbell: 84 },
  hipHinge: { barbell: 105 },
});

beforeEach(() => {
  useExerciseProgressStore.setState({ testHistory: [] });
  usePerformanceTestValuesStore.setState({ values: [] });
  useSportTestsStore.setState({
    testsBySport: {
      [ALL_SPORTS_CACHE_KEY]: [
        generateSportTest("SQUAT"),
        generateSportTest("DEADLIFT"),
      ],
    },
  });
  useUserProfileStore.getState().setWeight(70);
  useUserWorkoutStore.getState().setSport("SPORT_HANDBALL");
});

describe("useStoreStrengthTestResult", () => {
  it("stores the result as current maximums and in the test history", async () => {
    const strengthTestResult = generateStrengthTestResult();
    const { result } = await renderHook(() => useStoreStrengthTestResult());

    await act(() => result.current(strengthTestResult));

    expect(useUserWorkoutStore.getState().workoutData.maxValues).toEqual(
      strengthTestResult,
    );
    expect(useExerciseProgressStore.getState().testHistory).toEqual([
      strengthTestResult,
    ]);
  });

  it("adds a performance test value for every measured strength test", async () => {
    const { result } = await renderHook(() => useStoreStrengthTestResult());

    await act(() => result.current(generateStrengthTestResult()));

    expect(
      usePerformanceTestValuesStore
        .getState()
        .values.map(({ testCode, value }) => ({ testCode, value })),
    ).toEqual([
      { testCode: "SQUAT", value: 1.2 },
      { testCode: "DEADLIFT", value: 1.5 },
    ]);
  });

  it("adds performance test values only for the measured maximums", async () => {
    const measured: MaxValuesType = {
      ...DEFAULT_MAX_VALUES,
      testAt: new Date(2026, 10, 10, 12).getTime(),
      kneeDominant: { barbell: 84 },
    };
    const { result } = await renderHook(() => useStoreStrengthTestResult());

    await act(() => result.current(generateStrengthTestResult(), measured));

    expect(
      usePerformanceTestValuesStore
        .getState()
        .values.map(({ testCode }) => testCode),
    ).toEqual(["SQUAT"]);
  });
});
