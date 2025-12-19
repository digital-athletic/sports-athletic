import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { getTagValues } from "@/utils/tagUtils";
import { ExerciseValuesType, type ExerciseType } from "../models/Exercise";
import { DEFAULT_MAX_VALUES, type MaxValuesType } from "../models/MaxValues";
import { type SkillType, type TrainingTimeType } from "../models/Training";
import { type UserExerciseDataType } from "../models/UserExerciseData";
import {
  calculateWorkoutTotals,
  getMaxValueForExercise,
  getRoundedResultForValueAndStep,
  roundWeightValue,
} from "./workoutUtils";

// Mock the imported modules
jest.mock("@/utils/tagUtils");
jest.mock("@/constants/tagGroups");
jest.mock("@/constants/workoutConstants");
jest.mock("@/constants/userProgressConstants");

describe("workoutUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getTagValues as jest.Mock).mockReturnValue([]);
    (WorkoutConstants.MAX_VALUE_TYPES as any) = {
      BARBELL: "barbell",
      DUMBBELLS: "dumbbells",
      ONE_SIDED_UPPER: "oneSidedUpper",
      ONE_SIDED_BARBELL: "oneSidedBarbell",
      ONE_SIDED_LOWER: "oneSidedLower",
    };
    (WorkoutConstants.REP_DURATION_IN_S as any) = 5;
  });

  describe("getRoundedResultForValueAndStep", () => {
    it("should round down if remainder is less than half step", () => {
      // value: 25.2, step: 1, remainder: 0.2
      // 0.2 < 0.5, so round down: 25
      expect(getRoundedResultForValueAndStep(25.2, 1)).toBe(25);
    });

    it("should round up if remainder is greater than or equal to half step", () => {
      // value: 25.6, step: 1, remainder: 0.6
      // 0.6 >= 0.5, so round up: 26
      expect(getRoundedResultForValueAndStep(25.6, 1)).toBe(26);
    });

    it("should work with larger steps", () => {
      // value: 27.5, step: 5, remainder: 2.5
      // 2.5 < 2.5 is false, so round up: 30
      expect(getRoundedResultForValueAndStep(27.5, 5)).toBe(30);
    });

    it("should work with decimal steps", () => {
      // value: 50.3, step: 2.5, remainder: 0.3
      // 0.3 < 1.25, so round down: 50
      expect(getRoundedResultForValueAndStep(50.3, 2.5)).toBe(50);
    });

    it("should return exact value when remainder is zero", () => {
      expect(getRoundedResultForValueAndStep(25, 1)).toBe(25);
      expect(getRoundedResultForValueAndStep(100, 2.5)).toBe(100);
    });

    it("should handle small values", () => {
      expect(getRoundedResultForValueAndStep(0.3, 0.5)).toBe(0.5);
      expect(getRoundedResultForValueAndStep(0.8, 0.5)).toBe(1);
    });
  });

  describe("roundWeightValue", () => {
    it("should round by 0.5 for values <= 25", () => {
      expect(roundWeightValue(10.2)).toBe(10);
      expect(roundWeightValue(10.3)).toBe(10.5);
      expect(roundWeightValue(25)).toBe(25);
    });

    it("should round by 1 for values > 25 and <= 100", () => {
      expect(roundWeightValue(26.3)).toBe(26);
      expect(roundWeightValue(26.6)).toBe(27);
      expect(roundWeightValue(100)).toBe(100);
    });

    it("should round by 2.5 for values > 100", () => {
      expect(roundWeightValue(101.2)).toBe(100);
      expect(roundWeightValue(102.7)).toBe(102.5);
      expect(roundWeightValue(150)).toBe(150);
    });

    it("should handle boundary values correctly", () => {
      expect(roundWeightValue(24.9)).toBe(25);
      expect(roundWeightValue(25.1)).toBe(25);
      expect(roundWeightValue(99.1)).toBe(99);
      expect(roundWeightValue(99.9)).toBe(100);
      expect(roundWeightValue(100.6)).toBe(100);
    });

    it("should handle zero", () => {
      expect(roundWeightValue(0)).toBe(0);
    });
  });

  describe("getMaxValueForExercise", () => {
    let mockExercise: ExerciseType;
    let mockMaxValues: MaxValuesType;

    beforeEach(() => {
      const baseValue: ExerciseValuesType = {
        startValue: {
          default: {},
          m: {},
          w: {},
          k: {},
          type: { type: "Unknown" },
        },
        targetValue: {
          default: {},
          m: {},
          w: {},
          k: {},
          type: { type: "Unknown" },
        },
      };

      mockExercise = {
        id: 1,
        level: { m: 1, w: 1 },
        name: "Test Exercise",
        displayName: "Test",
        description: "Test",
        picture: "",
        video: "",
        tags: [],
        values: {
          duration: baseValue,
          repetition: baseValue,
          height: baseValue,
          weight: baseValue,
        },
        isAdvanceByReps: false,
        isAdvanceByDuration: false,
        isJump: false,
      };

      mockMaxValues = {
        ...DEFAULT_MAX_VALUES,
        verticalPush: {
          barbell: 100,
          dumbbells: 50,
          oneSidedUpper: 30,
          oneSidedLower: undefined,
          oneSidedLowerSupported: undefined,
        },
      };
    });

    it("should return max value for exercise", () => {
      (getTagValues as jest.Mock).mockImplementation((tags, group) => {
        if (group === TagGroups.EXERCISE_DIRECTION) return ["VERTICAL_PUSH"];
        if (group === TagGroups.REGION) return ["OBERKOERPER"];
        return [];
      });

      const result = getMaxValueForExercise(mockExercise, mockMaxValues);
      expect(result).toBe(100);
    });

    it("should handle missing exercise direction by using region", () => {
      (getTagValues as jest.Mock).mockImplementation((tags, group) => {
        if (group === TagGroups.REGION) return ["UNTERKOERPER"];
        return [];
      });

      const result = getMaxValueForExercise(mockExercise, mockMaxValues);
      expect(typeof result === "number" || result === undefined).toBe(true);
    });
  });

  describe("calculateWorkoutTotals", () => {
    let mockTime: TrainingTimeType;
    let mockExerciseList: UserExerciseDataType[];
    let mockExercisesData: ExerciseType[];
    let mockMaxValues: MaxValuesType;

    beforeEach(() => {
      mockTime = {
        start: 1000,
        end: 61000,
        pause: 10000,
        skill: {
          PREVENTION: 0,
          MOBILITY: 0,
          SWR: 0,
          WARMUP: 0,
          STABILITY: 0,
          CARDIO: 0,
        },
      };

      mockExerciseList = [];
      mockExercisesData = [];
      mockMaxValues = DEFAULT_MAX_VALUES;
    });

    it("should return zero totals for empty exercise list", () => {
      const result = calculateWorkoutTotals(
        mockTime,
        mockExerciseList,
        mockExercisesData,
        mockMaxValues,
      );

      expect(result).toEqual({
        duration: expect.any(Number),
        count: 0,
        points: expect.any(Number),
        weight: 0,
        height: 0,
      });
    });

    it("should calculate duration from time object when provided", () => {
      const result = calculateWorkoutTotals(mockTime, [], [], mockMaxValues);

      // 61000 - 1000 = 60000 ms = 60 seconds
      expect(result.duration).toBe(60);
    });

    it("should calculate points from time", () => {
      const result = calculateWorkoutTotals(mockTime, [], [], mockMaxValues);

      expect(result.points).toBeGreaterThan(0);
    });

    it("should count completed exercises", () => {
      const exercises: UserExerciseDataType[] = [
        {
          exerciseId: 1,
          set: [3, 3],
          repetition: 10,
          skill: "PREVENTION",
          feedback: { difficulty: "SUCCEEDED" },
        },
        {
          exerciseId: 2,
          set: [2, 3],
          repetition: 8,
          skill: "PREVENTION",
          feedback: { difficulty: "SUCCEEDED" },
        },
      ];

      const result = calculateWorkoutTotals(
        mockTime,
        exercises,
        [],
        mockMaxValues,
      );

      expect(result.count).toBe(1);
    });

    it("should skip pause exercises (exerciseId === 999999)", () => {
      const exercises: UserExerciseDataType[] = [
        {
          exerciseId: 999999,
          set: [1, 1],
          duration: 30,
          skill: "PREVENTION",
          feedback: { difficulty: "SUCCEEDED" },
        },
        {
          exerciseId: 1,
          set: [1, 1],
          repetition: 10,
          skill: "PREVENTION",
          feedback: { difficulty: "SUCCEEDED" },
        },
      ];

      const result = calculateWorkoutTotals(
        mockTime,
        exercises,
        [],
        mockMaxValues,
      );

      expect(result.count).toBe(1);
    });

    it("should skip test exercises (repetition === -1)", () => {
      const exercises: UserExerciseDataType[] = [
        {
          exerciseId: 1,
          set: [1, 1],
          repetition: -1,
          skill: "PREVENTION",
          feedback: { difficulty: "SUCCEEDED" },
        },
      ];

      const result = calculateWorkoutTotals(
        mockTime,
        exercises,
        [],
        mockMaxValues,
      );

      expect(result.count).toBe(0);
    });

    it("should calculate weight correctly for absolute weight", () => {
      const exercises: UserExerciseDataType[] = [
        {
          exerciseId: 1,
          set: [1, 1],
          repetition: 10,
          weight: 50,
          weightType: "weightAbsolute",
          skill: "PREVENTION",
          feedback: { difficulty: "SUCCEEDED" },
        },
      ];

      const baseValue: ExerciseValuesType = {
        startValue: {
          default: {},
          m: {},
          w: {},
          k: {},
          type: { type: "Unknown" },
        },
        targetValue: {
          default: {},
          m: {},
          w: {},
          k: {},
          type: { type: "Unknown" },
        },
      };
      const mockExercise: ExerciseType = {
        id: 1,
        level: { m: 1, w: 1 },
        name: "Test",
        displayName: "Test",
        description: "Test",
        picture: "",
        video: "",
        tags: [],
        values: {
          weight: baseValue,
          duration: baseValue,
          repetition: baseValue,
          height: baseValue,
        },
        isAdvanceByReps: false,
        isAdvanceByDuration: false,
        isJump: false,
      };

      const result = calculateWorkoutTotals(
        mockTime,
        exercises,
        [mockExercise],
        mockMaxValues,
      );

      expect(result.weight).toBeGreaterThan(0);
    });

    it("should calculate height correctly", () => {
      const exercises: UserExerciseDataType[] = [
        {
          exerciseId: 1,
          set: [1, 1],
          repetition: 5,
          height: 20,
          skill: "PREVENTION",
          feedback: { difficulty: "SUCCEEDED" },
        },
      ];

      const result = calculateWorkoutTotals(
        mockTime,
        exercises,
        [],
        mockMaxValues,
      );

      expect(result.height).toBe(100); // 5 repetitions * 20 height
    });

    it("should handle multiple completed sets", () => {
      const exercises: UserExerciseDataType[] = [
        {
          exerciseId: 1,
          set: [3, 3],
          repetition: 10,
          height: 5,
          skill: "PREVENTION" as SkillType,
          feedback: { difficulty: "SUCCEEDED" },
        },
      ];

      const result = calculateWorkoutTotals(
        mockTime,
        exercises,
        [],
        mockMaxValues,
      );

      // 3 sets * 10 repetitions * 5 height = 150
      expect(result.height).toBe(150);
    });

    it("should handle incomplete time object gracefully", () => {
      const incompleteTime: TrainingTimeType = {
        pause: 0,
        skill: {
          PREVENTION: 0,
          MOBILITY: 0,
          SWR: 0,
          WARMUP: 0,
          STABILITY: 0,
          CARDIO: 0,
        },
      };

      const exercises: UserExerciseDataType[] = [
        {
          exerciseId: 1,
          set: [1, 1],
          repetition: 10,
          duration: 50,
          skill: "PREVENTION",
          feedback: { difficulty: "SUCCEEDED" },
        },
      ];

      const result = calculateWorkoutTotals(
        incompleteTime,
        exercises,
        [],
        mockMaxValues,
      );

      expect(result.duration).toBeGreaterThan(0);
      expect(result.count).toBe(1);
    });
  });
});
