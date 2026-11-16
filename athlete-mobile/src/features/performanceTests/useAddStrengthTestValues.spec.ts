import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { type MaxValuesType } from "@/schemas/user.schema";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import {
  ALL_SPORTS_CACHE_KEY,
  useSportTestsStore,
} from "@/store/sportTestsStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Logger } from "@/services/Logger";
import { act, renderHook } from "@testing-library/react-native";
import { generateSportTest } from "./testFixtures";
import { useAddStrengthTestValues } from "./useAddStrengthTestValues";

/** A strength test result of 2026-11-10 with a squat of 84 kg, e.g. kneeDominant: { barbell: 84 }. */
const generateSquatResult = (): MaxValuesType => ({
  ...DEFAULT_MAX_VALUES,
  testAt: new Date(2026, 10, 10, 12).getTime(),
  kneeDominant: { barbell: 84 },
});

beforeEach(() => {
  usePerformanceTestValuesStore.setState({ values: [] });
  useSportTestsStore.setState({
    testsBySport: {
      [ALL_SPORTS_CACHE_KEY]: [
        generateSportTest("SQUAT"),
        generateSportTest("SPRINT_5M"),
      ],
    },
  });
  useUserProfileStore.getState().setWeight(70);
  useUserWorkoutStore.getState().setSport("SPORT_HANDBALL");
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_PERFORMANCE_TESTS_ENABLED;
});

describe("useAddStrengthTestValues", () => {
  it("stores the value of each cached strength test for the athlete's sport", async () => {
    const { result } = await renderHook(() => useAddStrengthTestValues());

    await act(() => result.current(generateSquatResult()));

    expect(usePerformanceTestValuesStore.getState().values).toEqual([
      {
        id: expect.any(String),
        sport: "SPORT_HANDBALL",
        testCode: "SQUAT",
        date: "2026-11-10",
        value: 1.2,
      },
    ]);
  });

  it("stores nothing without a body weight in the profile", async () => {
    useUserProfileStore.getState().setPersonalData({ weight: undefined });
    const { result } = await renderHook(() => useAddStrengthTestValues());

    await act(() => result.current(generateSquatResult()));

    expect(usePerformanceTestValuesStore.getState().values).toEqual([]);
  });

  it("stores nothing without cached performance tests", async () => {
    useSportTestsStore.setState({ testsBySport: {} });
    const { result } = await renderHook(() => useAddStrengthTestValues());

    await act(() => result.current(generateSquatResult()));

    expect(usePerformanceTestValuesStore.getState().values).toEqual([]);
  });

  it("stores nothing when the performance tests are switched off", async () => {
    process.env.EXPO_PUBLIC_PERFORMANCE_TESTS_ENABLED = "false";
    const { result } = await renderHook(() => useAddStrengthTestValues());

    await act(() => result.current(generateSquatResult()));

    expect(usePerformanceTestValuesStore.getState().values).toEqual([]);
  });
});

describe("useAddStrengthTestValues: failures", () => {
  const originalAddValue = usePerformanceTestValuesStore.getState().addValue;

  afterEach(() => {
    jest.restoreAllMocks();
    usePerformanceTestValuesStore.setState({ addValue: originalAddValue });
  });

  it("logs a failing store instead of throwing, so the strength test still finishes", async () => {
    const logError = jest.spyOn(Logger, "logError").mockResolvedValue();
    usePerformanceTestValuesStore.setState({
      addValue: () => {
        throw new Error("storage full");
      },
    });
    const { result } = await renderHook(() => useAddStrengthTestValues());

    expect(() => result.current(generateSquatResult())).not.toThrow();
    expect(logError).toHaveBeenCalledWith(expect.any(Error));
  });
});
