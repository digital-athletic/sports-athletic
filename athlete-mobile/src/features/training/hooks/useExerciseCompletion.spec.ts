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

let mockExerciseValues: object = {};

jest.mock("@/data/exerciseRegistry", () => ({
  getExerciseById: () => ({
    id: "900",
    name: "Barbell Hip Hinge",
    tags: ["EQ_BARBELL", "EQ_TYPE_WEIGHTS", "EXERCISE_DIRECTION_HIP"],
    isAdvanceByReps: true,
    isAdvanceByDuration: false,
    isJump: false,
    values: mockExerciseValues,
  }),
}));

jest.mock("@/data/skillTreeRegistry", () => {
  const branch = {
    tags: [],
    levels: {
      1: { exerciseId: "899" },
      2: { exerciseId: "900" },
      3: { exerciseId: "901" },
    },
  };
  return {
    ...jest.requireActual("@/data/skillTreeRegistry"),
    getAllSkillTrees: () => ({
      SWR2: { "77": branch },
      MAX_STRENGTH: { "78": branch },
      PREVKG: { "79": branch },
    }),
  };
});

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

const storeValues = () =>
  useExerciseProgressStore.getState().updateExercise(EXERCISE_ID, {
    exerciseId: EXERCISE_ID,
    skill: "SWR2",
    weight: 50,
    repetition: 9,
    nextWeightPercentage: 40,
    maxFRepetitions: [{ level: "HARD", repetitions: 3 }],
  });

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

  it("keeps feedback given in the same tick as the save", () => {
    seed({ repetition: 10 });
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => {
      result.current.handleFeedback(0, "SUCCEEDED");
      result.current.saveExerciseAndBranchData(0);
    });

    expect(stored()?.feedback?.difficulty).toBe("SUCCEEDED");
  });

  it("raises the weight by one weight step after TOO_EASY at the rep target", () => {
    seed({ repetition: 12, feedback: { difficulty: "TOO_EASY" } });
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => result.current.saveExerciseAndBranchData(0));

    // 70 % of 121 kg rounds to 85 kg, 85 kg x 1.025 rounds to 87.5 kg
    expect(stored()?.weight).toBeCloseTo(87.5 / 1.21);
    expect(stored()?.repetition).toBe(8);
    expect(stored()?.feedback?.difficulty).toBeNull();
  });

  it("stores the forced load as the weight", () => {
    // 33.06 % of 121 kg is 40 kg, the next step of 2.5 % rounds to 40 kg again
    seed({
      repetition: 12,
      weight: 40 / 1.21,
      feedback: { difficulty: "TOO_EASY" },
    });
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => result.current.saveExerciseAndBranchData(0));

    expect(stored()?.weight).toBeCloseTo(42.5 / 1.21);
  });

  describe("consecutive too hard count", () => {
    const completeWith = (
      difficulty: "TOO_HARD" | "TOO_EASY" | null,
      previousCount: number,
    ) => {
      seed({ repetition: 10, feedback: { difficulty } });
      useExerciseProgressStore.getState().updateExercise(EXERCISE_ID, {
        exerciseId: EXERCISE_ID,
        skill: "SWR2",
        tooHardCount: previousCount,
      });
      const { result } = renderHook(() => useExerciseCompletion());

      act(() => result.current.saveExerciseAndBranchData(0));
    };

    it("counts a too hard rating", () => {
      completeWith("TOO_HARD", 1);

      expect(stored()?.tooHardCount).toBe(2);
    });

    it("resets the count after another rating", () => {
      completeWith("TOO_EASY", 1);

      expect(stored()?.tooHardCount).toBe(0);
    });

    it("keeps the count when the athlete gives no rating", () => {
      completeWith(null, 1);

      expect(stored()?.tooHardCount).toBe(1);
    });
  });

  it("resets the record when TOO_HARD at the lowest load levels down", () => {
    seed({
      branchId: "77",
      repetition: 10,
      weight: 40,
      feedback: { difficulty: "TOO_HARD" },
    });
    storeValues();
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => result.current.saveExerciseAndBranchData(0));

    expect(useExerciseProgressStore.getState().getBranchLevel("77")).toBe(1);
    expect(stored()).toEqual({
      exerciseId: EXERCISE_ID,
      skill: "SWR2",
      branchId: "77",
    });
  });

  it("keeps the values but clears the feedback when no easier exercise exists", () => {
    seed({ repetition: 10, weight: 40, feedback: { difficulty: "TOO_HARD" } });
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => result.current.saveExerciseAndBranchData(0));

    expect(stored()?.weight).toBe(40);
    expect(stored()?.feedback?.difficulty).toBeNull();
  });
});

describe("useExerciseCompletion: block values after a weight increase", () => {
  const authored = {
    repetition: {
      startValue: { default: { advanced: 5 } },
      targetValue: { default: { advanced: 6 } },
    },
  };

  const completeGksAt = (type: string, repetition: number) => {
    mockExerciseValues = authored;
    seed({ skill: "GKS", repetition, feedback: { difficulty: "TOO_EASY" } });
    useTrainingStore.setState({ activeTraining: { id: "training-1", type } });
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => result.current.saveExerciseAndBranchData(0));
  };

  afterEach(() => {
    mockExerciseValues = {};
  });

  it("resets the repetitions to the exercise start in a template block with values exercise", () => {
    completeGksAt("GKS", 6);

    expect(stored()?.repetition).toBe(5);
  });

  it("resets the repetitions to the exercise start in a plan workout too", () => {
    completeGksAt("PLAN", 12);

    expect(stored()?.repetition).toBe(5);
  });
});

describe("useExerciseCompletion: max strength", () => {
  it("resets the record when the final value switches to the harder exercise", () => {
    seed({
      skill: "MAX_STRENGTH",
      branchId: "78",
      feedback: { difficulty: "SUCCEEDED" },
      maxFRepetitions: [
        { level: "HARD", repetitions: 6, weightPercentage: 70 },
        { level: "HARD", repetitions: 5, weightPercentage: 75 },
        { level: "HARD", repetitions: 3, weightPercentage: 80 },
      ],
    });
    storeValues();
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => result.current.saveExerciseAndBranchData(0));

    expect(useExerciseProgressStore.getState().getBranchLevel("78")).toBe(3);
    expect(stored()).toEqual({
      exerciseId: EXERCISE_ID,
      skill: "MAX_STRENGTH",
      branchId: "78",
    });
  });
});

describe("useExerciseCompletion: short workout branch level", () => {
  it("saves the level of a branch from a skill tree the template lists", () => {
    seed({ skill: "PREVKNEE", branchId: "79", repetition: 10 });
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => result.current.saveExerciseAndBranchData(0));

    expect(useExerciseProgressStore.getState().getBranchLevel("79")).toBe(2);
  });

  it("completes an exercise whose skill has no skill tree", () => {
    seed({ skill: "PREVHIP", branchId: "80", repetition: 10 });
    const { result } = renderHook(() => useExerciseCompletion());

    expect(() =>
      act(() => result.current.saveExerciseAndBranchData(0)),
    ).not.toThrow();
  });
});

describe("useExerciseCompletion: cardio", () => {
  it("stores no interval count after the last cardio interval", () => {
    seed({
      skill: "CARDIO_2",
      branchId: "b1",
      set: [4, 4],
      repetition: 4,
      duration: 60,
      weight: undefined,
    });
    const { result } = renderHook(() => useExerciseCompletion());

    act(() => result.current.saveExerciseAndBranchData(0));

    expect(stored()?.repetition).toBeUndefined();
    expect(stored()?.duration).toBeUndefined();
  });
});
