import type { ActiveTrainingType } from "@/features/training/models/ActiveTraining";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { IntensityData } from "@/features/training/models/Intensity";
import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import type { SkillCode } from "@/schemas/generator.schema";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import {
  calculateStandardExerciseAdjustment,
  deriveActiveExerciseIndex,
  type ExerciseAdjustmentContext,
  isFeedbackEligibleSkill,
  shouldProcessExerciseValues,
  shouldSkipExerciseSave,
} from "./exerciseDataUtils";
import {
  calculateWeightStep,
  getLowestPermittedWeight,
  isLowestLoadReached,
  isTargetLoadReached,
  getResetDuration,
  getResetRepetition,
  getTargetWeight,
} from "./weightAdjustmentUtils";

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
    skill: "SWR1",
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
      expect(shouldProcessExerciseValues(undefined, "SWR1")).toBe(false);
    });

    it("returns false when skill is undefined", () => {
      expect(shouldProcessExerciseValues("PLAN", undefined)).toBe(false);
    });

    it("returns false for NO_INCREASE workout types", () => {
      expect(shouldProcessExerciseValues("MOB", "SWR1")).toBe(false);
    });

    it("returns false for NO_INCREASE skill types", () => {
      expect(shouldProcessExerciseValues("PLAN", "WUSPEZIAL")).toBe(false);
    });

    it("returns false for a skill whose template has no progression", () => {
      // the WU template sets progression to false
      expect(shouldProcessExerciseValues("PLAN", "WU")).toBe(false);
    });

    it("returns true for valid type and skill", () => {
      expect(shouldProcessExerciseValues("PLAN", "SWR1")).toBe(true);
    });

    it.each<SkillCode>(["CARDIO_1_SHORT", "CARDIO_2", "CARDIO_5"])(
      "returns false for cardio skill %s",
      (skill) => {
        expect(shouldProcessExerciseValues("PLAN", skill)).toBe(false);
      },
    );
  });

  describe("isFeedbackEligibleSkill", () => {
    const withType = (type: string): ActiveTrainingType => ({
      id: "1",
      type,
    });

    it("returns false when activeTraining is null", () => {
      expect(isFeedbackEligibleSkill(null, "SWR1")).toBe(false);
    });

    it("returns false for PLAN training with a NO_INCREASE skill", () => {
      // the WU template sets progression to false
      expect(isFeedbackEligibleSkill(withType("PLAN"), "WU")).toBe(false);
    });

    it("returns true for PLAN training with an eligible skill", () => {
      expect(isFeedbackEligibleSkill(withType("PLAN"), "SWR1")).toBe(true);
    });

    it.each([
      "CARDIO_1_SHORT",
      "CARDIO_1_LAKTAT",
      "CARDIO_2",
      "CARDIO_3",
      "CARDIO_4",
      "CARDIO_5",
    ] as const)("returns false for the cardio skill %s", (skill) => {
      expect(isFeedbackEligibleSkill(withType("PLAN"), skill)).toBe(false);
    });

    it("returns false for a NO_INCREASE workout type", () => {
      // TEST_WORKOUT is in NO_INCREASE_WORKOUT_PLAN_TYPE list
      expect(isFeedbackEligibleSkill(withType("TEST_WORKOUT"), "SWR1")).toBe(
        false,
      );
    });

    it("returns true for a non-PLAN, non-NO_INCREASE workout type", () => {
      expect(isFeedbackEligibleSkill(withType("PREVKNEE"), "PREVKNEE")).toBe(
        true,
      );
    });

    it("returns false for the special warm-up inside a prevention workout", () => {
      expect(isFeedbackEligibleSkill(withType("PREVKNEE"), "WUSPEZIAL")).toBe(
        false,
      );
    });
  });

  describe("deriveActiveExerciseIndex", () => {
    it("returns 0 for a null exercise list", () => {
      expect(deriveActiveExerciseIndex(null)).toBe(0);
    });

    it("returns 0 for an empty exercise list", () => {
      expect(deriveActiveExerciseIndex([])).toBe(0);
    });

    it("returns the first entry without the completed mark", () => {
      const exerciseList = [
        createExerciseListItem({ exerciseId: "1", completed: true }),
        createExerciseListItem({ exerciseId: "2" }),
        createExerciseListItem({ exerciseId: "3" }),
      ];

      expect(deriveActiveExerciseIndex(exerciseList)).toBe(1);
    });

    it("clamps to the last index when every entry is completed", () => {
      const exerciseList = [
        createExerciseListItem({ exerciseId: "1", completed: true }),
        createExerciseListItem({ exerciseId: "2", completed: true }),
      ];

      expect(deriveActiveExerciseIndex(exerciseList)).toBe(1);
    });

    it("does not skip a pause row when nothing later has been completed yet", () => {
      const exerciseList = [
        createExerciseListItem({ exerciseId: "1", completed: true }),
        createExerciseListItem({ exerciseId: PAUSE_EXERCISE_ID }),
        createExerciseListItem({ exerciseId: "2" }),
      ];

      expect(deriveActiveExerciseIndex(exerciseList)).toBe(1);
    });

    it("skips a stale pause row when a later real exercise is already completed", () => {
      const exerciseList = [
        createExerciseListItem({ exerciseId: PAUSE_EXERCISE_ID }),
        createExerciseListItem({ exerciseId: "1", completed: true }),
        createExerciseListItem({ exerciseId: "2" }),
      ];

      expect(deriveActiveExerciseIndex(exerciseList)).toBe(2);
    });

    it("returns the pause row when it is genuinely the only remaining row", () => {
      const exerciseList = [
        createExerciseListItem({ exerciseId: "1", completed: true }),
        createExerciseListItem({ exerciseId: PAUSE_EXERCISE_ID }),
      ];

      expect(deriveActiveExerciseIndex(exerciseList)).toBe(1);
    });

    it("returns the stale pause itself when no real exercise remains after it", () => {
      const exerciseList = [
        createExerciseListItem({ exerciseId: PAUSE_EXERCISE_ID }),
        createExerciseListItem({ exerciseId: "1", completed: true }),
        createExerciseListItem({ exerciseId: PAUSE_EXERCISE_ID }),
      ];

      expect(deriveActiveExerciseIndex(exerciseList)).toBe(0);
    });

    it("does not return an already completed exercise when no real exercise remains after a stale pause", () => {
      const exerciseList = [
        createExerciseListItem({ exerciseId: PAUSE_EXERCISE_ID }),
        createExerciseListItem({ exerciseId: "1", completed: true }),
        createExerciseListItem({ exerciseId: "2", completed: true }),
      ];

      expect(deriveActiveExerciseIndex(exerciseList)).toBe(0);
    });

    it("treats the given index as completed when deriving", () => {
      const exerciseList = [
        createExerciseListItem({ exerciseId: "1" }),
        createExerciseListItem({ exerciseId: "2" }),
      ];

      expect(deriveActiveExerciseIndex(exerciseList, 0)).toBe(1);
    });

    it("returns a pause row as next when an earlier entry is treated as completed", () => {
      const exerciseList = [
        createExerciseListItem({ exerciseId: "1" }),
        createExerciseListItem({ exerciseId: "2", completed: true }),
        createExerciseListItem({ exerciseId: PAUSE_EXERCISE_ID }),
        createExerciseListItem({ exerciseId: "3" }),
      ];

      expect(deriveActiveExerciseIndex(exerciseList, 0)).toBe(2);
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
        "SUCCEEDED",
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
        "TOO_HARD",
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
        "SUCCEEDED",
      );
      expect(result.type).toBe("LEVEL_UP");
    });

    it("returns INCREASE_WEIGHT when reps >= target but weight < target", () => {
      const exercise = createExercise({
        isAdvanceByReps: true,
        tags: ["EQ_TYPE_WEIGHTS"],
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
        "SUCCEEDED",
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
        "SUCCEEDED",
      );
      expect(result).toEqual({ type: "NO_CHANGE", reason: "in_between_zone" });
    });
  });

  describe("calculateStandardExerciseAdjustment: feedback at the boundaries", () => {
    const repsExercise = createExercise({
      isAdvanceByReps: true,
      values: {
        repetition: {
          startValue: { m: { beginner: "8" } },
          targetValue: { m: { beginner: "12" } },
        },
      },
    });
    const durationExercise = createExercise({
      isAdvanceByDuration: true,
      values: {
        duration: {
          startValue: { m: { beginner: "30" } },
          targetValue: { m: { beginner: "60" } },
        },
      },
    });
    const weightedRepsExercise = createExercise({
      isAdvanceByReps: true,
      tags: ["EQ_TYPE_WEIGHTS"],
      values: {
        repetition: {
          startValue: { m: { beginner: "8" } },
          targetValue: { m: { beginner: "12" } },
        },
        weight: {
          startValue: { m: { beginner: "20" } },
          targetValue: { m: { beginner: "50" } },
        },
      },
    });
    const inBetween = { type: "NO_CHANGE", reason: "in_between_zone" };

    it.each(["SUCCEEDED", "TOO_EASY"] as const)(
      "levels up after the performed rep target with %s",
      (feedback) => {
        const result = calculateStandardExerciseAdjustment(
          0,
          0,
          12,
          repsExercise,
          createContext(),
          createIntensity(),
          feedback,
        );
        expect(result.type).toBe("LEVEL_UP");
      },
    );

    it("does not level up after the performed rep target with TOO_HARD", () => {
      const result = calculateStandardExerciseAdjustment(
        0,
        0,
        12,
        repsExercise,
        createContext(),
        createIntensity(),
        "TOO_HARD",
      );
      expect(result).toEqual(inBetween);
    });

    it("does not level up after the performed duration target with TOO_HARD", () => {
      const result = calculateStandardExerciseAdjustment(
        0,
        60,
        0,
        durationExercise,
        createContext(),
        createIntensity(),
        "TOO_HARD",
      );
      expect(result).toEqual(inBetween);
    });

    it("levels down after the performed rep start value with TOO_HARD", () => {
      const result = calculateStandardExerciseAdjustment(
        0,
        0,
        8,
        repsExercise,
        createContext(),
        createIntensity(),
        "TOO_HARD",
      );
      expect(result.type).toBe("LEVEL_DOWN");
    });

    it("levels down after the performed duration start value with TOO_HARD", () => {
      const result = calculateStandardExerciseAdjustment(
        0,
        30,
        0,
        durationExercise,
        createContext(),
        createIntensity(),
        "TOO_HARD",
      );
      expect(result.type).toBe("LEVEL_DOWN");
    });

    it.each(["SUCCEEDED", "TOO_EASY"] as const)(
      "progresses normally from the rep start value with %s",
      (feedback) => {
        const result = calculateStandardExerciseAdjustment(
          0,
          0,
          8,
          repsExercise,
          createContext(),
          createIntensity(),
          feedback,
        );
        expect(result).toEqual(inBetween);
      },
    );

    it("does not level down below the rep start value with SUCCEEDED", () => {
      const result = calculateStandardExerciseAdjustment(
        0,
        0,
        6,
        repsExercise,
        createContext(),
        createIntensity(),
        "SUCCEEDED",
      );
      expect(result).toEqual(inBetween);
    });

    it("increases weight after the performed rep target with SUCCEEDED", () => {
      const result = calculateStandardExerciseAdjustment(
        30,
        0,
        12,
        weightedRepsExercise,
        createContext(),
        createIntensity(),
        "SUCCEEDED",
      );
      expect(result.type).toBe("INCREASE_WEIGHT");
    });

    it("does not increase weight after the performed rep target with TOO_HARD", () => {
      const result = calculateStandardExerciseAdjustment(
        30,
        0,
        12,
        weightedRepsExercise,
        createContext(),
        createIntensity(),
        "TOO_HARD",
      );
      expect(result).toEqual(inBetween);
    });

    it("does not level up after the complete weighted target with TOO_HARD", () => {
      const result = calculateStandardExerciseAdjustment(
        50,
        0,
        12,
        weightedRepsExercise,
        createContext(),
        createIntensity(),
        "TOO_HARD",
      );
      expect(result).toEqual(inBetween);
    });

    it("does not decrease weight below the rep start value with SUCCEEDED", () => {
      const result = calculateStandardExerciseAdjustment(
        30,
        0,
        6,
        weightedRepsExercise,
        createContext(),
        createIntensity(),
        "SUCCEEDED",
      );
      expect(result).toEqual(inBetween);
    });
  });

  describe("calculateStandardExerciseAdjustment: missing feedback and load limits", () => {
    const repsExercise = createExercise({
      isAdvanceByReps: true,
      values: {
        repetition: {
          startValue: { m: { beginner: "8" } },
          targetValue: { m: { beginner: "12" } },
        },
      },
    });
    const weightedExercise = (
      weight: NonNullable<ExerciseType["values"]>["weight"],
    ) =>
      createExercise({
        isAdvanceByReps: true,
        tags: ["EQ_TYPE_WEIGHTS"],
        values: {
          repetition: {
            startValue: { m: { beginner: "8" } },
            targetValue: { m: { beginner: "12" } },
          },
          weight,
        },
      });
    const percentExercise = weightedExercise({
      startValue: { m: { beginner: "70" }, type: { type: "weightFMax" } },
      targetValue: {},
    });
    const noChange = { type: "NO_CHANGE", reason: "in_between_zone" };

    it.each([12, 8, 6])(
      "makes no change without feedback at %i reps",
      (reps) => {
        const result = calculateStandardExerciseAdjustment(
          0,
          0,
          reps,
          repsExercise,
          createContext(),
          createIntensity(),
          null,
        );
        expect(result).toEqual(noChange);
      },
    );

    it("levels down after TOO_HARD at the lowest permitted load", () => {
      const result = calculateStandardExerciseAdjustment(
        65,
        0,
        10,
        percentExercise,
        createContext(),
        createIntensity({ lowestPermittedWeight: 65 }),
        "TOO_HARD",
      );
      expect(result.type).toBe("LEVEL_DOWN");
    });

    it("keeps the level after TOO_HARD above the lowest permitted load", () => {
      const result = calculateStandardExerciseAdjustment(
        66,
        0,
        10,
        percentExercise,
        createContext(),
        createIntensity({ lowestPermittedWeight: 65 }),
        "TOO_HARD",
      );
      expect(result).toEqual(noChange);
    });

    describe("authored start of 57.5% below a lowest load of 65%", () => {
      const lowStartExercise = weightedExercise({
        startValue: { m: { beginner: "57.5" }, type: { type: "weightFMax" } },
        targetValue: {},
      });
      const tooHardAt = (weight: number) =>
        calculateStandardExerciseAdjustment(
          weight,
          0,
          10,
          lowStartExercise,
          createContext(),
          createIntensity({ lowestPermittedWeight: 65 }),
          "TOO_HARD",
        );

      it("levels down after TOO_HARD at the start weight", () => {
        expect(tooHardAt(57.5).type).toBe("LEVEL_DOWN");
      });

      it("keeps the level after TOO_HARD between start and area lowest", () => {
        expect(tooHardAt(60)).toEqual(noChange);
      });
    });

    it("compares a kg weight with a percentage target in kg", () => {
      const result = calculateStandardExerciseAdjustment(
        40,
        0,
        12,
        weightedExercise({
          startValue: {
            m: { beginner: "20" },
            type: { type: "weightAbsolute" },
          },
          targetValue: {},
        }),
        createContext({ maxValue: 200 }),
        createIntensity({
          targetValue: {
            weight: { default: { default: 30 }, type: { type: "weightFMax" } },
          },
        }),
        "SUCCEEDED",
      );
      expect(result.type).toBe("INCREASE_WEIGHT");
    });
  });

  describe("calculateStandardExerciseAdjustment: target load and consecutive too hard", () => {
    const weighted = (
      tags: string[],
      weight: NonNullable<ExerciseType["values"]>["weight"],
      isJump = false,
    ) =>
      createExercise({
        isAdvanceByReps: true,
        isJump,
        tags: ["EQ_TYPE_WEIGHTS", ...tags],
        values: {
          repetition: {
            startValue: { m: { beginner: "8" } },
            targetValue: { m: { beginner: "12" } },
          },
          weight,
        },
      });
    const absoluteKg = (target: string) => ({
      startValue: {
        m: { beginner: "10" },
        type: { type: "weightAbsolute" as const },
      },
      targetValue: {
        m: { beginner: target },
        type: { type: "weightAbsolute" as const },
      },
    });
    const percent = {
      startValue: {
        m: { beginner: "70" },
        type: { type: "weightFMax" as const },
      },
      targetValue: {},
    };
    const noChange = { type: "NO_CHANGE", reason: "in_between_zone" };
    const adjustWith =
      (intensity: IntensityData) =>
      (
        exercise: ExerciseType,
        weight: number,
        feedback: "SUCCEEDED" | "TOO_HARD",
        progress: { tooHardCount?: number } = {},
      ) =>
        calculateStandardExerciseAdjustment(
          weight,
          0,
          12,
          exercise,
          createContext({ maxValue: 100 }),
          intensity,
          feedback,
          progress,
        );
    const adjust = adjustWith(createIntensity());

    describe("target load", () => {
      const dumbbell = weighted(["EQ_DUMBBELL"], absoluteKg("15"));

      it("levels up when 14 kg performed meets a 15 kg target that rounds to 14 kg", () => {
        expect(adjust(dumbbell, 14, "SUCCEEDED").type).toBe("LEVEL_UP");
      });

      it("levels up when the weight reaches the rounded target", () => {
        const barbell = weighted(["EQ_BARBELL"], absoluteKg("42.5"));

        expect(adjust(barbell, 42.5, "SUCCEEDED").type).toBe("LEVEL_UP");
      });

      it("levels up when a clamped increase cannot change the load", () => {
        const barbell = weighted(["EQ_BARBELL"], absoluteKg("40"));

        expect(adjust(barbell, 39.5, "SUCCEEDED").type).toBe("LEVEL_UP");
      });

      it("increases the weight while the next load stays below the target", () => {
        const barbell = weighted(["EQ_BARBELL"], absoluteKg("50"));

        expect(adjust(barbell, 40, "SUCCEEDED").type).toBe("INCREASE_WEIGHT");
      });
    });

    describe("consecutive too hard on fixed kilograms", () => {
      const fixed = weighted(["EQ_DUMBBELL"], absoluteKg("20"));

      it("keeps the exercise after the first too hard", () => {
        expect(adjust(fixed, 12, "TOO_HARD", { tooHardCount: 1 })).toEqual(
          noChange,
        );
      });

      it("levels down on the first too hard when no lower load exists", () => {
        const emptyBar = weighted(["EQ_BARBELL"], absoluteKg("40"));

        expect(adjust(emptyBar, 20, "TOO_HARD", { tooHardCount: 1 }).type).toBe(
          "LEVEL_DOWN",
        );
      });

      it("levels down on the first too hard without additional weight", () => {
        expect(adjust(fixed, 0, "TOO_HARD", { tooHardCount: 1 }).type).toBe(
          "LEVEL_DOWN",
        );
      });

      it("levels down after the second too hard in a row", () => {
        expect(adjust(fixed, 12, "TOO_HARD", { tooHardCount: 2 }).type).toBe(
          "LEVEL_DOWN",
        );
      });

      it("keeps a percentage weight above its lowest load after the second too hard", () => {
        const result = adjustWith(
          createIntensity({ lowestPermittedWeight: 65 }),
        )(weighted(["EQ_BARBELL"], percent), 70, "TOO_HARD", {
          tooHardCount: 2,
        });

        expect(result).toEqual(noChange);
      });
    });

    describe("consecutive too hard on loaded jumps", () => {
      const jump = weighted(["EQ_BARBELL"], percent, true);
      const adjustJump = adjustWith(
        createIntensity({ lowestPermittedWeight: 70 }),
      );

      it.each([1, 2])(
        "keeps the exercise after %i too hard",
        (tooHardCount) => {
          expect(adjustJump(jump, 80, "TOO_HARD", { tooHardCount })).toEqual(
            noChange,
          );
        },
      );

      it("levels down after the third too hard in a row", () => {
        expect(adjustJump(jump, 80, "TOO_HARD", { tooHardCount: 3 }).type).toBe(
          "LEVEL_DOWN",
        );
      });

      it("levels down on the first too hard at the lowest load", () => {
        expect(adjustJump(jump, 70, "TOO_HARD", { tooHardCount: 1 }).type).toBe(
          "LEVEL_DOWN",
        );
      });
    });
  });

  describe("calculateWeightStep", () => {
    const barbell = createExercise({ tags: ["EQ_BARBELL"] });
    const plain = createExercise();
    const absolute = { weightType: "weightAbsolute" } as const;
    const percent = { weightType: "weightFMax" } as const;

    it("rounds the increased load", () => {
      expect(calculateWeightStep(40, "INCREASE", plain, absolute)).toBe(41);
    });

    it("rounds the reduced load", () => {
      expect(calculateWeightStep(40, "DECREASE", plain, absolute)).toBe(39);
    });

    it("steps from the rounded load of the current weight", () => {
      // 38 kg rounds to 37.5 kg, 37.5 kg x 1.025 rounds to 37.5 kg again, so the step forces 40 kg
      expect(calculateWeightStep(38, "INCREASE", barbell, absolute)).toBe(40);
    });

    it("stores a percentage weight as the percentage of the rounded load", () => {
      // 70 % of 121 kg rounds to 85 kg, 85 kg x 1.025 rounds to 87.5 kg
      expect(
        calculateWeightStep(70, "INCREASE", barbell, {
          ...percent,
          maxValue: 121,
        }),
      ).toBeCloseTo((87.5 / 121) * 100);
    });

    it("clamps the exact increase at the target before rounding", () => {
      // 75 kg x 1.025 is 76.875 kg; the step clamps it to the 76 kg target, which rounds to 75 kg
      expect(
        calculateWeightStep(75, "INCREASE", barbell, {
          ...percent,
          maxValue: 100,
          targetWeight: 76,
        }),
      ).toBe(75);
    });

    it("clamps the exact reduction at the lowest permitted weight before rounding", () => {
      // 66 % of 121 kg rounds to 80 kg; 80 kg x 0.975 is 78 kg, clamped to the
      // 78.65 kg lowest load, which rounds to 77.5 kg
      expect(
        calculateWeightStep(66, "DECREASE", barbell, {
          ...percent,
          maxValue: 121,
          lowestWeight: 65,
        }),
      ).toBeCloseTo((77.5 / 121) * 100);
    });

    it.each([
      ["without", undefined],
      ["with", 100],
    ])(
      "never raises a weight below the lowest permitted weight %s F-Max",
      (_, maxValue) => {
        expect(
          calculateWeightStep(5, "DECREASE", plain, {
            ...percent,
            maxValue,
            lowestWeight: 50,
          }),
        ).toBeLessThanOrEqual(5);
      },
    );

    it.each([
      ["INCREASE", 42.5],
      ["DECREASE", 37.5],
    ] as const)(
      "uses the next real load for %s when the step rounds to the current load",
      (direction, expected) => {
        expect(calculateWeightStep(40, direction, barbell, absolute)).toBe(
          expected,
        );
      },
    );

    it.each([
      ["INCREASE", 14],
      ["DECREASE", 10],
    ] as const)(
      "uses the next real dumbbell load for %s from 12 kg",
      (direction, expected) => {
        const dumbbell = createExercise({ tags: ["EQ_DUMBBELL"] });

        expect(calculateWeightStep(12, direction, dumbbell, absolute)).toBe(
          expected,
        );
      },
    );

    it("uses the next real load for a percentage weight", () => {
      expect(
        calculateWeightStep(40, "INCREASE", barbell, {
          ...percent,
          maxValue: 100,
        }),
      ).toBeCloseTo(42.5);
    });

    it("changes the load on every step of the worked example", () => {
      const up = calculateWeightStep(40, "INCREASE", barbell, absolute);
      const upAgain = calculateWeightStep(up, "INCREASE", barbell, absolute);
      const down = calculateWeightStep(upAgain, "DECREASE", barbell, absolute);

      expect([up, upAgain, down]).toEqual([42.5, 45, 42.5]);
    });

    it("lets the target win over the guaranteed load change", () => {
      expect(
        calculateWeightStep(40, "INCREASE", barbell, {
          ...absolute,
          targetWeight: 40,
        }),
      ).toBe(40);
    });

    it("forces the next load up to the rounded target", () => {
      expect(
        calculateWeightStep(40, "INCREASE", barbell, {
          ...absolute,
          targetWeight: 42,
        }),
      ).toBe(42.5);
    });

    it("does not force a reduction below the lowest permitted load", () => {
      expect(
        calculateWeightStep(40, "DECREASE", barbell, {
          ...absolute,
          lowestWeight: 40,
        }),
      ).toBe(40);
    });
  });

  describe("load boundaries: no step without a load change", () => {
    const barbell = createExercise({ tags: ["EQ_BARBELL"] });
    const percent = { weightType: "weightFMax" } as const;

    it("reaches the target when the exact step exceeds it but rounds to the current load", () => {
      expect(
        isTargetLoadReached(75, barbell, {
          ...percent,
          maxValue: 100,
          targetWeight: 76,
        }),
      ).toBe(true);
    });

    it("reaches the target when the next dumbbell load lies above it", () => {
      const dumbbell = createExercise({ tags: ["EQ_DUMBBELL"] });

      // 12 kg is 12 % of 100 kg; the next load of 14 kg exceeds the 13 % target
      expect(
        isTargetLoadReached(12, dumbbell, {
          ...percent,
          maxValue: 100,
          targetWeight: 13,
        }),
      ).toBe(true);
    });

    it("keeps the target open while an increase changes the load", () => {
      expect(
        isTargetLoadReached(70, barbell, {
          ...percent,
          maxValue: 100,
          targetWeight: 76,
        }),
      ).toBe(false);
    });

    it("reaches the lowest load when the rounded lowest load lies above it", () => {
      // 65 % of 123 kg is 79.95 kg and rounds to 80 kg, which is 65.04 %
      expect(
        isLowestLoadReached((80 / 123) * 100, barbell, {
          ...percent,
          maxValue: 123,
          lowestWeight: 65,
        }),
      ).toBe(true);
    });

    it("reaches the lowest load at the empty bar", () => {
      // 20 kg of a 25 kg F-Max is 80 %, above the 65 % lowest load
      expect(
        isLowestLoadReached(80, barbell, {
          ...percent,
          maxValue: 25,
          lowestWeight: 65,
        }),
      ).toBe(true);
    });

    it("keeps the lowest load open while a reduction changes the load", () => {
      expect(
        isLowestLoadReached(70, barbell, {
          ...percent,
          maxValue: 100,
          lowestWeight: 65,
        }),
      ).toBe(false);
    });
  });

  describe("getLowestPermittedWeight", () => {
    const withStart = (start: string) =>
      createExercise({
        values: {
          weight: {
            startValue: {
              m: { beginner: start },
              type: { type: "weightFMax" },
            },
            targetValue: {},
          },
        },
      });
    const intensity = createIntensity({ lowestPermittedWeight: 65 });

    it.each([
      ["57.5", 57.5],
      ["70", 65],
    ])("authored start %s gives a lowest load of %s", (start, expected) => {
      expect(
        getLowestPermittedWeight(intensity, "weightFMax", withStart(start), {
          userLevel: "beginner",
          genderTag: "m",
        }),
      ).toBe(expected);
    });
  });

  describe("getTargetWeight", () => {
    const kgExercise = (target: Record<string, number> = {}) =>
      createExercise({
        values: {
          weight: {
            startValue: {
              default: { beginner: 40 },
              type: { type: "weightAbsolute" },
            },
            targetValue: {
              default: target,
              type: { type: "weightAbsolute" },
            },
          },
        },
      });
    // The intensity config authors its weights in % of F-Max.
    const percentIntensity = createIntensity({
      startValue: {
        weight: { m: { beginner: 50 }, type: { type: "weightFMax" } },
      },
      targetValue: {
        weight: { m: { beginner: 60 }, type: { type: "weightFMax" } },
      },
    });

    it("keeps an authored kg target for a kg exercise", () => {
      expect(
        getTargetWeight(percentIntensity, kgExercise({ beginner: 70 }), {
          userLevel: "beginner",
          genderTag: "m",
        }),
      ).toBe(70);
    });

    it("skips the clamp when a kg exercise falls back to a % target", () => {
      const exercise = kgExercise();
      const targetWeight = getTargetWeight(percentIntensity, exercise, {
        userLevel: "beginner",
        genderTag: "m",
      });

      expect(targetWeight).toBeUndefined();
      expect(
        calculateWeightStep(60, "INCREASE", exercise, {
          weightType: "weightAbsolute",
          targetWeight,
        }),
      ).toBeGreaterThan(60);
    });

    it("rounds an authored kg target to a loadable weight", () => {
      const dumbbell = {
        ...kgExercise({ beginner: 15 }),
        tags: ["EQ_DUMBBELL"],
      };

      expect(
        getTargetWeight(percentIntensity, dumbbell, {
          userLevel: "beginner",
          genderTag: "m",
        }),
      ).toBe(14);
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
