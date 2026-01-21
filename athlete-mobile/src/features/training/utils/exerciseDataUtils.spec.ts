import type { ExerciseType } from "@/features/training/models/Exercise";
import type { IntensityData } from "@/features/training/models/Intensity";
import type { SkillType } from "@/features/training/models/Training";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import {
  calculateNewWeight,
  calculateStandardExerciseAdjustment,
  type ExerciseAdjustmentContext,
  findMainCardioExercise,
  getResetDuration,
  getResetRepetition,
  shouldProcessExerciseValues,
  shouldSkipExerciseSave,
} from "./exerciseDataUtils";

// Minimal exercise data for testing
const createExercise = (overrides: Partial<ExerciseType> = {}): ExerciseType =>
  ({
    id: "1",
    name: "Test Exercise",
    tags: [],
    isAdvanceByReps: false,
    isAdvanceByDuration: false,
    values: {},
    ...overrides,
  }) as ExerciseType;

const createContext = (
  overrides: Partial<ExerciseAdjustmentContext> = {},
): ExerciseAdjustmentContext => ({
  userLevel: "beginner",
  genderTag: "m",
  ageGroup: "ADULT",
  ...overrides,
});

// Minimal intensity mock matching IntensityData structure
const createIntensity = (
  overrides: Partial<IntensityData> = {},
): IntensityData =>
  ({
    startValue: {
      duration: {
        m: { beginner: 20 },
        w: { beginner: 20 },
        k: { beginner: 20 },
      },
      repetition: {
        m: { beginner: 8 },
        w: { beginner: 8 },
        k: { beginner: 8 },
      },
      weight: { m: { beginner: 20 }, w: { beginner: 15 }, k: { beginner: 10 } },
    },
    targetValue: {
      duration: {
        m: { beginner: 60 },
        w: { beginner: 60 },
        k: { beginner: 60 },
      },
      repetition: {
        m: { beginner: 15 },
        w: { beginner: 15 },
        k: { beginner: 15 },
      },
      weight: { m: { beginner: 50 }, w: { beginner: 40 }, k: { beginner: 25 } },
    },
    adjustment: {},
    ...overrides,
  }) as IntensityData;

// Helper to create minimal exercise list entries
const createExerciseListItem = (
  overrides: Partial<UserExerciseDataType>,
): UserExerciseDataType =>
  ({
    exerciseId: "1",
    branchId: "10",
    skill: "SWR",
    ...overrides,
  }) as UserExerciseDataType;

describe("exerciseDataUtils", () => {
  describe("shouldSkipExerciseSave", () => {
    it("returns skip for pause exercise", () => {
      const result = shouldSkipExerciseSave(true, 10);
      expect(result).toEqual({ skip: true, reason: "pause_exercise" });
    });

    it("returns skip for test exercise (reps === -1)", () => {
      const result = shouldSkipExerciseSave(false, -1);
      expect(result).toEqual({ skip: true, reason: "test_exercise" });
    });

    it("returns no skip for normal exercise", () => {
      const result = shouldSkipExerciseSave(false, 10);
      expect(result).toEqual({ skip: false });
    });
  });

  describe("shouldProcessExerciseValues", () => {
    it("returns false when type is undefined", () => {
      expect(shouldProcessExerciseValues(undefined, "SWR")).toBe(false);
    });

    it("returns false when skill is undefined", () => {
      expect(shouldProcessExerciseValues("PLAN", undefined)).toBe(false);
    });

    it("returns false for NO_INCREASE workout types", () => {
      expect(shouldProcessExerciseValues("MOB", "SWR")).toBe(false);
    });

    it("returns false for NO_INCREASE skill types", () => {
      // WU is in NO_INCREASE_SKILL_TYPE list (cast needed as SkillType doesn't include WU)
      expect(shouldProcessExerciseValues("PLAN", "WU" as SkillType)).toBe(
        false,
      );
    });

    it("returns true for valid type and skill", () => {
      expect(shouldProcessExerciseValues("PLAN", "SWR")).toBe(true);
    });
  });

  describe("findMainCardioExercise", () => {
    it("returns null for null exercise list", () => {
      expect(findMainCardioExercise(null, 0)).toBeNull();
    });

    it("finds cardio exercise by walking back", () => {
      const exerciseList = [
        createExerciseListItem({
          exerciseId: "1",
          branchId: "10",
          skill: "CARDIO",
        }),
        createExerciseListItem({
          exerciseId: "2",
          branchId: "-1",
          skill: "CARDIO",
        }),
        createExerciseListItem({
          exerciseId: "3",
          branchId: "20",
          skill: "SWR",
        }),
      ];
      const result = findMainCardioExercise(exerciseList, 2);
      expect(result).toEqual({ branchId: "10", exerciseId: "1" });
    });

    it("skips exercises with branchId -1", () => {
      const exerciseList = [
        createExerciseListItem({
          exerciseId: "1",
          branchId: "10",
          skill: "CARDIO",
        }),
        createExerciseListItem({
          exerciseId: "2",
          branchId: "-1",
          skill: "CARDIO",
        }),
      ];
      const result = findMainCardioExercise(exerciseList, 1);
      expect(result).toEqual({ branchId: "10", exerciseId: "1" });
    });

    it("returns null when no cardio found", () => {
      const exerciseList = [
        createExerciseListItem({
          exerciseId: "1",
          branchId: "10",
          skill: "SWR",
        }),
      ];
      expect(findMainCardioExercise(exerciseList, 0)).toBeNull();
    });
  });

  describe("calculateStandardExerciseAdjustment", () => {
    it("returns LEVEL_UP when reps >= target (non-weight exercise)", () => {
      const exercise = createExercise({
        isAdvanceByReps: true,
        tags: [],
        values: {
          repetition: {
            startValue: { m: { beginner: "5" } },
            targetValue: { m: { beginner: "10" } },
          },
        },
      });
      const result = calculateStandardExerciseAdjustment(
        0,
        0,
        15,
        exercise,
        createContext(),
        createIntensity(),
      );
      expect(result.type).toBe("LEVEL_UP");
    });

    it("returns LEVEL_DOWN when reps < start (non-weight exercise)", () => {
      const exercise = createExercise({
        isAdvanceByReps: true,
        tags: [],
        values: {
          repetition: {
            startValue: { m: { beginner: "10" } },
            targetValue: { m: { beginner: "20" } },
          },
        },
      });
      const result = calculateStandardExerciseAdjustment(
        0,
        0,
        5,
        exercise,
        createContext(),
        createIntensity(),
      );
      expect(result.type).toBe("LEVEL_DOWN");
    });

    it("returns LEVEL_UP when duration >= target (non-weight exercise)", () => {
      const exercise = createExercise({
        isAdvanceByDuration: true,
        tags: [],
        values: {
          duration: {
            startValue: { m: { beginner: "15" } },
            targetValue: { m: { beginner: "30" } },
          },
        },
      });
      const result = calculateStandardExerciseAdjustment(
        0,
        45,
        0,
        exercise,
        createContext(),
        createIntensity(),
      );
      expect(result.type).toBe("LEVEL_UP");
    });

    it("returns INCREASE_WEIGHT when reps >= target but weight < target", () => {
      const exercise = createExercise({
        isAdvanceByReps: true,
        tags: ["EQTYPE_WEIGHTS"],
        values: {
          repetition: {
            startValue: { m: { beginner: "5" } },
            targetValue: { m: { beginner: "10" } },
          },
          weight: {
            startValue: { m: { beginner: "20" } },
            targetValue: { m: { beginner: "50" } },
          },
        },
      });
      const result = calculateStandardExerciseAdjustment(
        30,
        0,
        15,
        exercise,
        createContext(),
        createIntensity(),
      );
      expect(result.type).toBe("INCREASE_WEIGHT");
    });

    it("returns NO_CHANGE when in between zone", () => {
      const exercise = createExercise({
        isAdvanceByReps: true,
        tags: [],
        values: {
          repetition: {
            startValue: { m: { beginner: "5" } },
            targetValue: { m: { beginner: "20" } },
          },
        },
      });
      const result = calculateStandardExerciseAdjustment(
        0,
        0,
        10,
        exercise,
        createContext(),
        createIntensity(),
      );
      expect(result).toEqual({ type: "NO_CHANGE", reason: "in_between_zone" });
    });
  });

  describe("calculateNewWeight", () => {
    const exercise = createExercise({ values: {} });

    it("increases weight with weightAbsolute adjustment", () => {
      const intensity = createIntensity({
        adjustment: {
          weightAbsolute: {
            default: { default: { SUCCEEDED: 5, TOO_HARD: -5, TOO_EASY: 2.5 } },
          },
        },
      });
      const result = calculateNewWeight(50, "SUCCEEDED", exercise, intensity);
      expect(result).toBe(55);
    });

    it("decreases weight with weightAbsolute adjustment", () => {
      const intensity = createIntensity({
        adjustment: {
          weightAbsolute: {
            default: { default: { SUCCEEDED: 5, TOO_HARD: -5, TOO_EASY: 2.5 } },
          },
        },
      });
      const result = calculateNewWeight(50, "TOO_HARD", exercise, intensity);
      expect(result).toBe(45);
    });

    it("returns current weight when no adjustment configured", () => {
      const intensity = createIntensity({ adjustment: {} });
      const result = calculateNewWeight(50, "SUCCEEDED", exercise, intensity);
      expect(result).toBe(50);
    });
  });

  describe("getResetDuration", () => {
    it("returns undefined when not advance by duration", () => {
      const exercise = createExercise({ isAdvanceByDuration: false });
      const result = getResetDuration(
        exercise,
        createIntensity(),
        "m",
        "beginner",
      );
      expect(result).toBeUndefined();
    });

    it("returns exercise start value when available", () => {
      const exercise = createExercise({
        isAdvanceByDuration: true,
        values: {
          duration: {
            startValue: { m: { beginner: "30" } },
            targetValue: { m: { beginner: "60" } },
          },
        },
      });
      const result = getResetDuration(
        exercise,
        createIntensity(),
        "m",
        "beginner",
      );
      expect(result).toBe(30);
    });

    it("falls back to intensity start value", () => {
      const exercise = createExercise({
        isAdvanceByDuration: true,
        values: {},
      });
      const intensity = createIntensity({
        startValue: { duration: { m: { beginner: 25 } } },
      });
      const result = getResetDuration(exercise, intensity, "m", "beginner");
      expect(result).toBe(25);
    });
  });

  describe("getResetRepetition", () => {
    it("returns undefined when not advance by reps", () => {
      const exercise = createExercise({ isAdvanceByReps: false });
      const result = getResetRepetition(
        exercise,
        createIntensity(),
        "m",
        "beginner",
      );
      expect(result).toBeUndefined();
    });

    it("returns exercise start value when available", () => {
      const exercise = createExercise({
        isAdvanceByReps: true,
        values: {
          repetition: {
            startValue: { m: { beginner: "12" } },
            targetValue: { m: { beginner: "20" } },
          },
        },
      });
      const result = getResetRepetition(
        exercise,
        createIntensity(),
        "m",
        "beginner",
      );
      expect(result).toBe(12);
    });
  });
});
