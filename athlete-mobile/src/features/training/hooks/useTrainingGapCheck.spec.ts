import { Alert } from "@/common/Alert";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { act, renderHook } from "@testing-library/react-native";
import { useTrainingGapCheck } from "./useTrainingGapCheck";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const plan = {
  start: "2026-08-03",
  sections: [
    { start: "2026-08-03", numOfWeeks: 4, type: "SWR1", trainings: [] },
  ],
} as unknown as TrainingPlanType;

const lastWorkoutDaysAgo = (days: number) =>
  useCompletedWorkoutsStore.setState({
    workoutsList: [
      {
        id: "workout",
        timestamp: new Date(2026, 9, 12 - days, 18).getTime(),
        summary: "",
      },
    ],
  });

const promptButtons = () => {
  const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
  return buttons as { text: string; onPress?: () => void }[];
};

describe("useTrainingGapCheck", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 12, 10) });
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    mockPush.mockClear();
    useUserWorkoutStore.setState({ trainingPlan: plan });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("saves the shifted plan after a gap of 8 to 21 days", () => {
    lastWorkoutDaysAgo(14);
    renderHook(() => useTrainingGapCheck(true));
    expect(useUserWorkoutStore.getState().trainingPlan?.sections[0].start).toBe(
      "2026-08-17",
    );
  });

  it("shifts the plan only once for the same gap", () => {
    lastWorkoutDaysAgo(14);
    renderHook(() => useTrainingGapCheck(true));
    renderHook(() => useTrainingGapCheck(true));
    expect(useUserWorkoutStore.getState().trainingPlan?.sections[0].start).toBe(
      "2026-08-17",
    );
  });

  it("keeps the plan after a gap of a week", () => {
    lastWorkoutDaysAgo(7);
    renderHook(() => useTrainingGapCheck(true));
    expect(useUserWorkoutStore.getState().trainingPlan).toBe(plan);
  });

  it("asks for a new plan after more than 21 days", () => {
    lastWorkoutDaysAgo(22);
    renderHook(() => useTrainingGapCheck(true));
    expect(Alert.alert).toHaveBeenCalledWith(
      "training.selectTraining.trainingGap.title",
      "training.selectTraining.trainingGap.message",
      expect.any(Array),
    );
  });

  it("opens plan creation when the athlete accepts", () => {
    lastWorkoutDaysAgo(22);
    renderHook(() => useTrainingGapCheck(true));
    act(() => {
      promptButtons()
        .find((b) => b.text === "common.yes")
        ?.onPress?.();
    });
    expect(mockPush).toHaveBeenCalledWith("/(more)/anamnesis/season-phase");
  });

  it("keeps the existing plan when the athlete declines", () => {
    lastWorkoutDaysAgo(22);
    renderHook(() => useTrainingGapCheck(true));
    act(() => {
      promptButtons()
        .find((b) => b.text === "common.no")
        ?.onPress?.();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("checks nothing when disabled", () => {
    lastWorkoutDaysAgo(22);
    renderHook(() => useTrainingGapCheck(false));
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
