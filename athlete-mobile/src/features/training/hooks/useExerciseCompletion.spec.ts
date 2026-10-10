import { useTrainingStore } from "@/features/training/trainingStore";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { act, renderHook } from "@testing-library/react-native";
import { useExerciseCompletion } from "./useExerciseCompletion";

const EXERCISE_ID = "900";

jest.mock("@/data/exerciseRegistry", () => ({
  getExerciseById: () => ({
    id: "900",
    name: "Barbell Hip Hinge",
    tags: ["EQ_BARBELL", "EQ_TYPE_WEIGHTS", "EXERCISE_DIRECTION_HIP"],
    isAdvanceByReps: true,
    isAdvanceByDuration: false,
    isJump: false,
    values: {},
  }),
}));

const seed = (entry: Partial<UserExerciseDataType>) => {
  useTrainingStore.setState(BASELINE_TRAINING_STATE);
  useTrainingStore.setState({
    exerciseList: [
      {
        exerciseId: EXERCISE_ID,
        skill: "SWR2",
        branchId: "-1",
        set: [3, 3],
        weight: 70,
        weightType: "weightFMax",
        ...entry,
      },
    ],
    activeTraining: { id: "training-1", type: "PLAN" },
  });
  useUserWorkoutStore.setState({
    workoutData: {
      sport: "OTHER_SPORT",
      tags: { LEVEL: ["ADVANCED"] },
      seasonPhase: { type: null, endDate: "2026-01-01" },
      maxValues: {
        ...DEFAULT_MAX_VALUES,
        hipHinge: { ...DEFAULT_MAX_VALUES.hipHinge, barbell: 121 },
      },
    },
  });
  useUserProfileStore.setState({
    personalData: { username: "test", gender: "MALE", birthday: "1990-01-01" },
  });
  const progress = useExerciseProgressStore.getState();
  progress.resetProgress();
  progress.updateExercise(EXERCISE_ID, {
    exerciseId: EXERCISE_ID,
    skill: "SWR2",
    feedback: { difficulty: "TOO_EASY" },
  });
};

const stored = () =>
  useExerciseProgressStore.getState().exerciseData[EXERCISE_ID];

describe("useExerciseCompletion: standard progression", () => {
  it("drops the stored feedback when the athlete gives none", () => {
    seed({ repetition: 10 });
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => result.current.saveExerciseAndBranchData(0));

    expect(stored()?.feedback?.difficulty).toBeNull();
    expect(stored()?.repetition).toBe(10);
  });

  it("raises the weight by one weight step after TOO_EASY at the rep target", () => {
    seed({ repetition: 12, feedback: { difficulty: "TOO_EASY" } });
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => result.current.saveExerciseAndBranchData(0));

    expect(stored()?.weight).toBeCloseTo(71.75);
    expect(stored()?.repetition).toBe(8);
    expect(stored()?.feedback?.difficulty).toBeNull();
  });
});
