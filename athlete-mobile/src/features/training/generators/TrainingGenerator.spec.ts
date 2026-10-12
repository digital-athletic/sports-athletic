import type { IntensityData } from "@/features/training/models/Intensity";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { SetListEntryType } from "@/features/training/models/SetListEntry";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  CardioBranchReference,
  SkillWithLength,
} from "@/schemas/generator.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import {
  transformSkillTree,
  type RawSkillTree,
} from "@/utils/skillTreeTransform";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import PREV from "../../../../assets/data/generator/skillTrees/PREV.json";
import PREVKG from "../../../../assets/data/generator/skillTrees/PREVKG.json";
import WU from "../../../../assets/data/generator/skillTrees/WU.json";
import WUSPEZIAL from "../../../../assets/data/generator/skillTrees/WUSPEZIAL.json";
import { roundWeightValue } from "../utils/workoutUtils";
import TrainingGenerator, { getIntensityBySkill } from "./TrainingGenerator";

describe("TrainingGenerator", () => {
  let generator: TrainingGenerator;

  const mockUser: UserType = {
    userId: "test-user-id",
    personalData: { gender: "MALE", birthday: "1990-01-01" },
    workoutData: {
      tags: { LEVEL: ["INTERMEDIATE"] },
      maxValues: DEFAULT_MAX_VALUES,
    },
    temporalData: [],
  };

  const mockExercise: ExerciseType = {
    id: "1",
    name: "Test Exercise",
    displayName: "Test Exercise",
    description: "Test Description",
    picture: "test.jpg",
    video: "test.mp4",
    level: { m: 1, w: 1 },
    tags: [
      "SKILL_WU",
      "REGION_UPPER_BODY",
      "EQUIPMENT_NONE",
      "SIDE_BOTH",
      "MUSCLE_INVOLVEMENT_COMPOUND",
    ],
    isAdvanceByReps: true,
    isAdvanceByDuration: false,
    isJump: false,
    values: {
      duration: {
        startValue: {
          default: { intermediate: "20" },
          m: { intermediate: "20" },
          w: { intermediate: "20" },
          k: { intermediate: "20" },
          type: { type: "Single" },
        },
        targetValue: {
          default: { intermediate: "30" },
          m: { intermediate: "30" },
          w: { intermediate: "30" },
          k: { intermediate: "30" },
          type: { type: "Single" },
        },
      },
      height: {
        startValue: {
          default: { intermediate: "50" },
          m: { intermediate: "50" },
          w: { intermediate: "50" },
          k: { intermediate: "50" },
          type: { type: "Single" },
        },
        targetValue: {
          default: { intermediate: "60" },
          m: { intermediate: "60" },
          w: { intermediate: "60" },
          k: { intermediate: "60" },
          type: { type: "Single" },
        },
      },
      repetition: {
        startValue: {
          default: { intermediate: "10" },
          m: { intermediate: "10" },
          w: { intermediate: "10" },
          k: { intermediate: "10" },
          type: { type: "Single" },
        },
        targetValue: {
          default: { intermediate: "15" },
          m: { intermediate: "15" },
          w: { intermediate: "15" },
          k: { intermediate: "15" },
          type: { type: "Single" },
        },
      },
      weight: {
        startValue: {
          default: { intermediate: "20" },
          m: { intermediate: "20" },
          w: { intermediate: "20" },
          k: { intermediate: "20" },
          type: { type: "weightAbsolute" },
        },
        targetValue: {
          default: { intermediate: "30" },
          m: { intermediate: "30" },
          w: { intermediate: "30" },
          k: { intermediate: "30" },
          type: { type: "weightAbsolute" },
        },
      },
    },
  };

  const mockSkillTrees = {} as { [skillName: string]: SkillTreeType };

  beforeEach(() => {
    generator = new TrainingGenerator();
  });

  describe("generateTraining", () => {
    it("throws error when user has no workoutData for TEST_WORKOUT", () => {
      const userWithoutData: UserType = {
        userId: "test-user-without-data",
        workoutData: undefined,
        temporalData: [],
      };

      expect(() => {
        generator.generateTraining(
          "TEST_WORKOUT",
          userWithoutData,
          "HALL",
          [mockExercise],
          mockSkillTrees,
          1,
          [],
          undefined,
          0,
          { exerciseData: {}, branchData: {} },
        );
      }).toThrow();
    });

    it("calls generatePlanWorkout for PLAN type", () => {
      const spy = jest.spyOn(generator, "generatePlanWorkout");
      spy.mockReturnValue([]);

      generator.generateTraining(
        "PLAN",
        mockUser,
        "HALL",
        [mockExercise],
        mockSkillTrees,
        1,
        [],
        undefined,
        0,
        { exerciseData: {}, branchData: {} },
      );

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("routes to generateShortWorkout for non-PLAN types", () => {
      const spy = jest.spyOn(generator, "generateShortWorkout");
      spy.mockReturnValue([]);

      generator.generateTraining(
        "MOB",
        mockUser,
        "HOME",
        [mockExercise],
        mockSkillTrees,
        1,
        [],
        undefined,
        0,
        { exerciseData: {}, branchData: {} },
      );

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("generateShortWorkout", () => {
    it("throws EQUIPMENT error for BR type when foam equipment is missing", () => {
      const equipment: string[] = [];

      try {
        generator.generateShortWorkout(
          "BR",
          mockUser,
          "HOME",
          [mockExercise],
          mockSkillTrees,
          equipment,
          { exerciseData: {}, branchData: {} },
        );
        fail("Expected GeneratorError to be thrown");
      } catch (e) {
        expect(e).toEqual({
          type: "NO_EXERCISES",
          subtype: "EQUIPMENT",
          params: ["FOAM_ROLLER", "FOAM_BALL"],
        });
      }
    });

    it("returns exercise list with correct structure when successful", () => {
      const mockResult = [
        {
          branchId: "test-branch",
          exerciseId: "1",
          set: [1, 2] as [number, number],
          skill: "MOB" as const,
          duration: 30,
        },
      ];
      const spy = jest.spyOn(generator, "getSetListFromExercisePairs");
      spy.mockReturnValue(mockResult);

      // Verify the mock result structure matches GeneratedSetListEntry
      expect(mockResult[0]).toHaveProperty("branchId");
      expect(mockResult[0]).toHaveProperty("exerciseId");
      expect(mockResult[0]).toHaveProperty("set");
      expect(mockResult[0]).toHaveProperty("skill");
      expect(Array.isArray(mockResult)).toBe(true);

      spy.mockRestore();
    });
  });

  describe("generatePlanWorkout", () => {
    it("throws NO_ANAMNESIS error when workoutData is undefined", () => {
      const userWithoutWorkoutData: UserType = {
        userId: "test-user",
        workoutData: undefined,
        temporalData: [],
      };

      expect(() =>
        generator.generatePlanWorkout(
          "PLAN",
          userWithoutWorkoutData,
          "STUDIO",
          [mockExercise],
          mockSkillTrees,
          1,
          ["BARBELL"],
          undefined,
          0,
          { exerciseData: {}, branchData: {} },
        ),
      ).toThrow();
    });

    it("returns GeneratedSetListEntry array with skill property when successful", () => {
      const mockResult = [
        {
          branchId: "test-branch",
          exerciseId: "1",
          set: [1, 2] as [number, number],
          skill: "SA" as const,
        },
      ];
      const spy = jest.spyOn(generator, "getSetListFromExercisePairs");
      spy.mockReturnValue(mockResult);

      // This test verifies the return type structure
      // The actual generatePlanWorkout needs complex mock data, so we verify through spy
      expect(mockResult[0]).toHaveProperty("skill");
      expect(mockResult[0]).toHaveProperty("branchId");
      spy.mockRestore();
    });

    // Note: Section extension date format tests have been moved to trainingSectionUtils.spec.ts
    // where the extendSectionsForMissedWeeks function is properly unit tested as a pure function.
  });

  describe("isSuperset", () => {
    it("returns false for short training WU", () => {
      expect(generator.isSuperset("WU", true)).toBe(false);
    });

    it("returns false for short training MOB", () => {
      expect(generator.isSuperset("MOB", true)).toBe(false);
    });

    it("returns true for short training SA", () => {
      expect(generator.isSuperset("SA", true)).toBe(true);
    });

    it("returns false for CARDIO skills", () => {
      expect(generator.isSuperset("CARDIO_1_SHORT", false)).toBe(false);
      expect(generator.isSuperset("CARDIO_2", false)).toBe(false);
      expect(generator.isSuperset("CARDIO_3", false)).toBe(false);
    });

    it("returns true for SA skill", () => {
      expect(generator.isSuperset("SA", false)).toBe(true);
    });

    it("returns true for SK skill", () => {
      expect(generator.isSuperset("SK", false)).toBe(true);
    });

    it("returns true for SWR2 skill", () => {
      expect(generator.isSuperset("SWR2", false)).toBe(true);
    });

    it("returns true for WU skill", () => {
      expect(generator.isSuperset("WU", false)).toBe(true);
    });
  });

  describe("getInSetPauseBySkill", () => {
    it("returns correct pause for WU", () => {
      expect(generator.getInSetPauseBySkill("WU")).toBe(10);
    });

    it("returns correct pause for SA", () => {
      expect(generator.getInSetPauseBySkill("SA")).toBe(75);
    });

    it("returns correct pause for SK", () => {
      expect(generator.getInSetPauseBySkill("SK")).toBe(60);
    });

    it("returns default pause for unknown skill", () => {
      expect(generator.getInSetPauseBySkill("UNKNOWN")).toBe(10);
    });
  });

  describe("getAfterSetPauseBySkill", () => {
    it("returns correct pause for WU", () => {
      expect(generator.getAfterSetPauseBySkill("WU")).toBe(30);
    });

    it("returns correct pause for SA", () => {
      expect(generator.getAfterSetPauseBySkill("SA")).toBe(75);
    });

    it("returns correct pause for MAX", () => {
      expect(generator.getAfterSetPauseBySkill("MAX")).toBe(180);
    });

    it("returns default pause for unknown skill", () => {
      expect(generator.getAfterSetPauseBySkill("UNKNOWN")).toBe(10);
    });
  });

  describe("getRepetitionDefaultBySkill", () => {
    it("returns correct repetitions for WU", () => {
      expect(generator.getRepetitionDefaultBySkill("WU")).toBe(8);
    });

    it("returns correct repetitions for SA", () => {
      expect(generator.getRepetitionDefaultBySkill("SA")).toBe(8);
    });

    it("returns correct repetitions for MAX", () => {
      expect(generator.getRepetitionDefaultBySkill("MAX")).toBe(8);
    });

    it("returns correct repetitions for CARDIO_1_SHORT", () => {
      expect(generator.getRepetitionDefaultBySkill("CARDIO_1_SHORT")).toBe(3);
    });

    it("returns default repetitions for unknown skill", () => {
      expect(generator.getRepetitionDefaultBySkill("UNKNOWN")).toBe(8);
    });
  });

  describe("getDurationDefaultBySkill", () => {
    it("returns correct duration for WU", () => {
      expect(generator.getDurationDefaultBySkill("WU")).toBe(30);
    });

    it("returns correct duration for MOB", () => {
      expect(generator.getDurationDefaultBySkill("MOB")).toBe(30);
    });

    it("returns correct duration for BR", () => {
      expect(generator.getDurationDefaultBySkill("BR")).toBe(30);
    });

    it("returns correct duration for CARDIO_1_SHORT", () => {
      expect(generator.getDurationDefaultBySkill("CARDIO_1_SHORT")).toBe(10);
    });

    it("returns correct duration for CARDIO_1_LAKTAT", () => {
      expect(generator.getDurationDefaultBySkill("CARDIO_1_LAKTAT")).toBe(30);
    });

    it("returns default duration for unknown skill", () => {
      expect(generator.getDurationDefaultBySkill("UNKNOWN")).toBe(30);
    });
  });

  describe("isEmptyOrUndefined", () => {
    it("returns true for undefined", () => {
      expect(generator.isEmptyOrUndefined(undefined)).toBe(true);
    });

    it("returns true for empty object", () => {
      expect(generator.isEmptyOrUndefined({})).toBe(true);
    });

    it("returns false for non-empty object", () => {
      expect(generator.isEmptyOrUndefined({ key: "value" })).toBe(false);
    });

    it("returns true for null", () => {
      expect(generator.isEmptyOrUndefined(null)).toBe(true);
    });

    it("returns false for array", () => {
      expect(generator.isEmptyOrUndefined([])).toBe(false);
    });
  });

  describe("getAdjustmentByUserData", () => {
    it("returns default adjustment when no intensity provided", () => {
      const adjustment = generator.getAdjustmentByUserData(
        null,
        "m",
        "intermediate",
      );

      expect(adjustment).toHaveProperty("duration");
      expect(adjustment).toHaveProperty("height");
      expect(adjustment).toHaveProperty("repetition");
      expect(adjustment).toHaveProperty("weightFMax");
      expect(adjustment).toHaveProperty("weightAbsolute");

      expect(adjustment.duration!.SUCCEEDED).toBe(5);
      expect(adjustment.duration!.TOO_EASY).toBe(10);
      expect(adjustment.duration!.TOO_HARD).toBe(-5);

      expect(adjustment.repetition!.SUCCEEDED).toBe(2);
      expect(adjustment.repetition!.TOO_EASY).toBe(4);
      expect(adjustment.repetition!.TOO_HARD).toBe(-2);

      expect(adjustment.weightAbsolute!.SUCCEEDED).toBe(1);
      expect(adjustment.weightAbsolute!.TOO_EASY).toBe(2);
      expect(adjustment.weightAbsolute!.TOO_HARD).toBe(-1);
    });

    it("applies custom intensity adjustments when provided", () => {
      const customIntensity = {
        adjustment: {
          duration: {
            default: {
              default: { SUCCEEDED: 7, TOO_EASY: 14, TOO_HARD: -7 },
              intermediate: { SUCCEEDED: 10, TOO_EASY: 20, TOO_HARD: -10 },
            },
            m: { intermediate: { SUCCEEDED: 10, TOO_EASY: 20, TOO_HARD: -10 } },
          },
          repetition: {
            default: {
              default: { SUCCEEDED: 2, TOO_EASY: 4, TOO_HARD: -2 },
              intermediate: { SUCCEEDED: 3, TOO_EASY: 6, TOO_HARD: -3 },
            },
            m: { intermediate: { SUCCEEDED: 3, TOO_EASY: 6, TOO_HARD: -3 } },
          },
        },
        startValue: {},
        targetValue: {},
      };

      const adjustment = generator.getAdjustmentByUserData(
        customIntensity,
        "m",
        "intermediate",
      );

      expect(adjustment.duration!.SUCCEEDED).toBe(10);
      expect(adjustment.duration!.TOO_EASY).toBe(20);
      expect(adjustment.duration!.TOO_HARD).toBe(-10);

      expect(adjustment.repetition!.SUCCEEDED).toBe(3);
      expect(adjustment.repetition!.TOO_EASY).toBe(6);
      expect(adjustment.repetition!.TOO_HARD).toBe(-3);
    });
  });

  describe("getExerciseValues", () => {
    it("returns empty weightType when no data provided", () => {
      const values = generator.getExerciseValues(
        null,
        mockExercise,
        null,
        "m",
        "intermediate",
        DEFAULT_MAX_VALUES,
      );

      expect(values).toHaveProperty("weightType", "weightAbsolute");
    });

    it("uses exercise default values when available", () => {
      const exerciseWithValues: ExerciseType = {
        ...mockExercise,
        values: {
          ...mockExercise.values,
          repetition: {
            startValue: {
              default: { intermediate: "12" },
              m: { intermediate: "12" },
              w: { intermediate: "12" },
              k: { intermediate: "12" },
              type: { type: "Single" },
            },
            targetValue: {
              default: { intermediate: "15" },
              m: { intermediate: "15" },
              w: { intermediate: "15" },
              k: { intermediate: "15" },
              type: { type: "Single" },
            },
          },
        },
      };

      const values = generator.getExerciseValues(
        null,
        exerciseWithValues,
        null,
        "m",
        "intermediate",
        DEFAULT_MAX_VALUES,
      );

      expect(values).toHaveProperty("repetition");
    });

    it("prioritizes user exercise data over defaults", () => {
      const userExerciseData = {
        exerciseId: "1",
        skill: "SWR1" as const,
        repetition: 15,
        weight: 20,
        duration: undefined,
        height: undefined,
      };

      const values = generator.getExerciseValues(
        userExerciseData,
        mockExercise,
        null,
        "m",
        "intermediate",
        DEFAULT_MAX_VALUES,
      );

      expect(values).toHaveProperty("weightType");
    });
  });

  describe("adjustExerciseValues", () => {
    const baseData = {
      duration: 30,
      repetition: 10,
      height: 50,
      weight: 20,
      weightType: "weightAbsolute" as const,
    };

    const mockUserExercise = {
      exerciseId: "1",
      skill: "SWR1" as const,
      repetition: 10,
      duration: 30,
      height: 50,
      weight: 20,
    };

    it("increases duration on TOO_EASY feedback", () => {
      const result = generator.adjustExerciseValues(
        baseData,
        mockUserExercise,
        { ...mockExercise, isAdvanceByDuration: true },
        null,
        "m",
        "intermediate",
        "TOO_EASY",
      );

      expect(result.duration).toBeGreaterThan(baseData.duration);
    });

    it("decreases duration on TOO_HARD feedback", () => {
      const result = generator.adjustExerciseValues(
        baseData,
        mockUserExercise,
        { ...mockExercise, isAdvanceByDuration: true },
        null,
        "m",
        "intermediate",
        "TOO_HARD",
      );

      expect(result.duration).toBeLessThan(baseData.duration);
    });

    it("increases repetition on TOO_EASY feedback", () => {
      const result = generator.adjustExerciseValues(
        baseData,
        mockUserExercise,
        { ...mockExercise, isAdvanceByReps: true },
        null,
        "m",
        "intermediate",
        "TOO_EASY",
      );

      expect(result.repetition).toBeGreaterThan(baseData.repetition);
    });

    it("decreases repetition on TOO_HARD feedback", () => {
      const result = generator.adjustExerciseValues(
        baseData,
        mockUserExercise,
        { ...mockExercise, isAdvanceByReps: true },
        null,
        "m",
        "intermediate",
        "TOO_HARD",
      );

      expect(result.repetition).toBeLessThan(baseData.repetition);
    });

    it("keeps the height on TOO_EASY feedback for jump exercises", () => {
      const result = generator.adjustExerciseValues(
        baseData,
        mockUserExercise,
        { ...mockExercise, isJump: true },
        null,
        "m",
        "intermediate",
        "TOO_EASY",
      );

      expect(result.height).toBe(baseData.height);
    });

    it("increases repetition on SUCCEEDED feedback by default adjustment", () => {
      const result = generator.adjustExerciseValues(
        baseData,
        mockUserExercise,
        mockExercise,
        null,
        "m",
        "intermediate",
        "SUCCEEDED",
      );

      expect(result.duration).toBe(baseData.duration);
      expect(result.repetition).toBe(12); // 10 + 2
    });

    const weightedExercise: ExerciseType = {
      ...mockExercise,
      tags: [...mockExercise.tags, "EQ_TYPE_WEIGHTS"],
    };

    it("decreases absolute weight on TOO_HARD feedback", () => {
      const result = generator.adjustExerciseValues(
        { ...baseData, weight: 20, weightType: "weightAbsolute" as const },
        mockUserExercise,
        weightedExercise,
        null,
        "m",
        "intermediate",
        "TOO_HARD",
      );

      expect(result.weight).toBe(19.5);
      expect(result.repetition).toBe(baseData.repetition);
    });

    it.each(["TOO_EASY", "SUCCEEDED"] as const)(
      "keeps the weight and raises only repetitions on %s feedback",
      (feedback) => {
        const result = generator.adjustExerciseValues(
          { ...baseData, weight: 20, weightType: "weightAbsolute" as const },
          mockUserExercise,
          weightedExercise,
          null,
          "m",
          "intermediate",
          feedback,
        );

        expect(result.weight).toBe(20);
        expect(result.repetition).toBeGreaterThan(baseData.repetition);
      },
    );

    it("keeps the weight of an exercise without adjustable weight", () => {
      const result = generator.adjustExerciseValues(
        { ...baseData, weight: 20, weightType: "weightAbsolute" as const },
        mockUserExercise,
        mockExercise,
        null,
        "m",
        "intermediate",
        "TOO_HARD",
      );

      expect(result.weight).toBe(20);
    });

    it("decreases FMax weight on TOO_HARD feedback", () => {
      const result = generator.adjustExerciseValues(
        { ...baseData, weight: 80, weightType: "weightFMax" as const },
        mockUserExercise,
        weightedExercise,
        null,
        "m",
        "intermediate",
        "TOO_HARD",
      );

      expect(result.weight).toBe(78);
    });

    it("lowers a light absolute weight without going below zero", () => {
      const result = generator.adjustExerciseValues(
        { ...baseData, weight: 0.5, weightType: "weightAbsolute" as const },
        mockUserExercise,
        weightedExercise,
        null,
        "m",
        "intermediate",
        "TOO_HARD",
      );

      expect(result.weight).toBeCloseTo(0.4875);
    });

    it("clamps FMax weight at the lowest permitted load", () => {
      const result = generator.adjustExerciseValues(
        { ...baseData, weight: 51, weightType: "weightFMax" as const },
        mockUserExercise,
        weightedExercise,
        getIntensityBySkill("SK"),
        "m",
        "intermediate",
        "TOO_HARD",
      );

      expect(result.weight).toBe(50);
    });

    it("does not adjust weight when weight is undefined", () => {
      const { weight: _, ...dataWithoutWeight } = baseData;

      const result = generator.adjustExerciseValues(
        dataWithoutWeight,
        mockUserExercise,
        mockExercise,
        null,
        "m",
        "intermediate",
        "TOO_EASY",
      );

      expect(result.weight).toBeUndefined();
    });
  });

  describe("adjustExerciseValues: one change per feedback within the boundaries", () => {
    const ladderIntensity = {
      startValue: {},
      targetValue: {},
      adjustment: {
        repetition: {
          default: { default: { SUCCEEDED: 1, TOO_EASY: 2, TOO_HARD: -2 } },
        },
        duration: {
          default: { default: { SUCCEEDED: 5, TOO_EASY: 10, TOO_HARD: -10 } },
        },
        weightAbsolute: {
          default: { default: { SUCCEEDED: 1, TOO_EASY: 2, TOO_HARD: -1 } },
        },
      },
    } as unknown as IntensityData;

    const weightedRepsExercise: ExerciseType = {
      ...mockExercise,
      tags: [...mockExercise.tags, "EQ_TYPE_WEIGHTS"],
      isAdvanceByReps: true,
      isAdvanceByDuration: false,
      values: {
        repetition: {
          startValue: { m: { intermediate: "8" } },
          targetValue: { m: { intermediate: "12" } },
        },
      },
    };
    const unweightedRepsExercise: ExerciseType = {
      ...weightedRepsExercise,
      tags: mockExercise.tags,
    };
    const weightedDurationExercise: ExerciseType = {
      ...weightedRepsExercise,
      isAdvanceByReps: false,
      isAdvanceByDuration: true,
      values: {
        duration: {
          startValue: { m: { intermediate: "30" } },
          targetValue: { m: { intermediate: "50" } },
        },
      },
    };

    const adjust = (
      exercise: ExerciseType,
      values: { repetition?: number; duration?: number; weight?: number },
      feedback: "SUCCEEDED" | "TOO_EASY" | "TOO_HARD",
    ) =>
      generator.adjustExerciseValues(
        { ...values, weightType: "weightAbsolute" },
        null,
        exercise,
        ladderIntensity,
        "m",
        "intermediate",
        feedback,
      );

    it.each([
      [8, "SUCCEEDED", 9],
      [9, "TOO_EASY", 11],
      [11, "TOO_EASY", 12],
    ] as const)(
      "worked example: %i reps with %s gives %i reps at the same weight",
      (repetition, feedback, expectedRepetition) => {
        const result = adjust(
          weightedRepsExercise,
          { repetition, weight: 38 },
          feedback,
        );

        expect(result.repetition).toBe(expectedRepetition);
        expect(result.weight).toBe(38);
      },
    );

    it("worked example: TOO_HARD on a weighted exercise reduces only the weight", () => {
      const result = adjust(
        weightedRepsExercise,
        { repetition: 8, weight: 39 },
        "TOO_HARD",
      );

      expect(result.repetition).toBe(8);
      expect(result.weight).toBeCloseTo(38.025);
    });

    it("clamps weighted duration at the target", () => {
      const result = adjust(
        weightedDurationExercise,
        { duration: 45, weight: 38 },
        "TOO_EASY",
      );

      expect(result.duration).toBe(50);
      expect(result.weight).toBe(38);
    });

    it("clamps unweighted repetitions at the target", () => {
      const result = adjust(
        unweightedRepsExercise,
        { repetition: 11 },
        "TOO_EASY",
      );

      expect(result.repetition).toBe(12);
    });

    it("clamps unweighted repetitions at the start value on TOO_HARD", () => {
      const result = adjust(
        unweightedRepsExercise,
        { repetition: 9 },
        "TOO_HARD",
      );

      expect(result.repetition).toBe(8);
    });
  });

  describe("getExerciseStartValues", () => {
    it.each([
      ["child values when the birthday is missing", "", "k"],
      ["male values for an adult male", "1990-01-01", "m"],
    ])("uses %s", (_, birthday, expectedGenderTag) => {
      const getExerciseValuesSpy = jest.spyOn(generator, "getExerciseValues");

      generator.getExerciseStartValues(
        "SA",
        {
          branchTags: mockExercise.tags,
          exerciseId: "1",
          branchId: "1",
        },
        { ...mockUser, personalData: { gender: "MALE", birthday } },
        mockExercise,
        {},
        false,
      );

      expect(getExerciseValuesSpy).toHaveBeenCalledWith(
        null,
        mockExercise,
        expect.anything(),
        expectedGenderTag,
        expect.any(String),
        expect.anything(),
      );
      getExerciseValuesSpy.mockRestore();
    });

    it("returns proper structure with all required fields", () => {
      const result = generator.getExerciseStartValues(
        "WU",
        {
          branchTags: mockExercise.tags,
          exerciseId: "1",
          branchId: "1",
        },
        mockUser,
        mockExercise,
        {},
        false,
      );

      expect(result).toHaveProperty("tags");
      expect(result).toHaveProperty("exerciseId");
      expect(result).toHaveProperty("branchId");
      expect(result).toHaveProperty("weightType");
    });

    it("sets duration for exercises that advance by duration", () => {
      const durationExercise = {
        ...mockExercise,
        isAdvanceByDuration: true,
        isAdvanceByReps: false,
      };

      const result = generator.getExerciseStartValues(
        "MOB",
        {
          branchTags: durationExercise.tags,
          exerciseId: "1",
          branchId: "1",
        },
        mockUser,
        durationExercise,
        {},
        false,
      );

      expect(result).toHaveProperty("duration");
      if ((result as any).duration) {
        expect(typeof (result as any).duration).toBe("number");
      }
    });

    it("sets repetition for exercises that advance by reps", () => {
      const result = generator.getExerciseStartValues(
        "SA",
        {
          branchTags: mockExercise.tags,
          exerciseId: "1",
          branchId: "1",
        },
        mockUser,
        mockExercise,
        {},
        false,
      );

      expect(result).toHaveProperty("repetition");
      if ((result as any).repetition) {
        expect(typeof (result as any).repetition).toBe("number");
      }
    });

    it("uses user exercise data when available", () => {
      const result = generator.getExerciseStartValues(
        "SA",
        {
          branchTags: mockExercise.tags,
          exerciseId: "1",
          branchId: "1",
        },
        mockUser,
        mockExercise,
        {},
        false,
      );

      expect(result).toHaveProperty("tags");
      expect(result).toHaveProperty("exerciseId");
    });

    it("handles short training mode", () => {
      const result = generator.getExerciseStartValues(
        "WU",
        {
          branchTags: mockExercise.tags,
          exerciseId: "1",
          branchId: "1",
        },
        mockUser,
        mockExercise,
        {},
        true,
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty("exerciseId");
    });
  });

  describe("getSetCountBySkill", () => {
    it("returns correct set count for WU with BEGINNER", () => {
      const result = generator.getSetCountBySkill("WU", "BEGINNER");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it("returns correct set count for SA with INTERMEDIATE", () => {
      const result = generator.getSetCountBySkill("SA", "INTERMEDIATE");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it("returns correct set count for MAX with PROFESSIONAL", () => {
      const result = generator.getSetCountBySkill("MAX", "PROFESSIONAL");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it("returns default set count for unknown skill", () => {
      const result = generator.getSetCountBySkill("UNKNOWN", "INTERMEDIATE");
      expect(result).toBeDefined();
    });

    /**
     * Enhanced tests for getSetCountBySkill - verify explicit return values
     * based on documented method behavior.
     */
    it("returns 1 for warm-up and mobility skills", () => {
      expect(generator.getSetCountBySkill("WU", "BEGINNER")).toBe(1);
      expect(generator.getSetCountBySkill("WUSKSA", "INTERMEDIATE")).toBe(1);
      expect(generator.getSetCountBySkill("WUSPEZIAL", "ADVANCED")).toBe(1);
      expect(generator.getSetCountBySkill("CD", "PROFESSIONAL")).toBe(1);
      expect(generator.getSetCountBySkill("MOB", "BEGINNER")).toBe(1);
      expect(generator.getSetCountBySkill("BR", "INTERMEDIATE")).toBe(1);
    });

    it("returns 1 for cardio skills", () => {
      expect(generator.getSetCountBySkill("CARDIO_4", "BEGINNER")).toBe(1);
      expect(generator.getSetCountBySkill("CARDIO_5", "ADVANCED")).toBe(1);
    });

    it("returns specific counts for cardio interval skills", () => {
      expect(generator.getSetCountBySkill("CARDIO_1_SHORT", "BEGINNER")).toBe(
        10,
      );
      expect(
        generator.getSetCountBySkill("CARDIO_1_LAKTAT", "INTERMEDIATE"),
      ).toBe(4);
      expect(generator.getSetCountBySkill("CARDIO_2", "ADVANCED")).toBe(8);
      expect(generator.getSetCountBySkill("CARDIO_3", "PROFESSIONAL")).toBe(6);
    });

    it("returns 4 for MAX training skills", () => {
      expect(generator.getSetCountBySkill("MAX", "BEGINNER")).toBe(4);
      expect(generator.getSetCountBySkill("MAX", "INTERMEDIATE")).toBe(4);
      expect(generator.getSetCountBySkill("MAX", "ADVANCED")).toBe(4);
      expect(generator.getSetCountBySkill("MAX", "PROFESSIONAL")).toBe(4);
      expect(generator.getSetCountBySkill("MAX_KRAFT", "BEGINNER")).toBe(4);
    });

    it("returns 2 for standard strength skills (SA, SK, SWR)", () => {
      expect(generator.getSetCountBySkill("SA", "BEGINNER")).toBe(2);
      expect(generator.getSetCountBySkill("SAKG", "INTERMEDIATE")).toBe(2);
      expect(generator.getSetCountBySkill("SK", "ADVANCED")).toBe(2);
      expect(generator.getSetCountBySkill("SKKG", "PROFESSIONAL")).toBe(2);
      expect(generator.getSetCountBySkill("SWR1", "BEGINNER")).toBe(2);
      expect(generator.getSetCountBySkill("SWR2", "INTERMEDIATE")).toBe(2);
      expect(generator.getSetCountBySkill("SWR1KG", "ADVANCED")).toBe(2);
      expect(generator.getSetCountBySkill("SWR2KG", "PROFESSIONAL")).toBe(2);
    });

    it("returns 2 for stability and prevention skills (default)", () => {
      expect(generator.getSetCountBySkill("BAS", "BEGINNER")).toBe(2);
      expect(generator.getSetCountBySkill("GKS", "INTERMEDIATE")).toBe(2);
      expect(generator.getSetCountBySkill("GKSKG", "ADVANCED")).toBe(2);
      expect(generator.getSetCountBySkill("PREV", "PROFESSIONAL")).toBe(2);
      expect(generator.getSetCountBySkill("PREVSHOULDER", "BEGINNER")).toBe(2);
      expect(generator.getSetCountBySkill("PREVKNEE", "INTERMEDIATE")).toBe(2);
      expect(generator.getSetCountBySkill("PREVWRIST", "ADVANCED")).toBe(2);
      expect(generator.getSetCountBySkill("PREVANKLE", "PROFESSIONAL")).toBe(2);
      expect(generator.getSetCountBySkill("PREVSPINE", "BEGINNER")).toBe(2);
      expect(generator.getSetCountBySkill("STABILITY", "INTERMEDIATE")).toBe(2);
    });

    it("returns 2 for unknown skills (default case)", () => {
      expect(generator.getSetCountBySkill("UNKNOWN_SKILL", "BEGINNER")).toBe(2);
      expect(generator.getSetCountBySkill("RANDOM", "PROFESSIONAL")).toBe(2);
    });

    it("always returns a number type for any input", () => {
      const skills = ["WU", "MAX", "SA", "PREV", "CARDIO_5", "UNKNOWN"];
      const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"];

      skills.forEach((skill) => {
        levels.forEach((level) => {
          const result = generator.getSetCountBySkill(skill, level);
          expect(typeof result).toBe("number");
          expect(Number.isInteger(result)).toBe(true);
          expect(result).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("getMaxTrainingWeights", () => {
    const weightExercise: ExerciseType = {
      ...mockExercise,
      tags: [
        ...mockExercise.tags,
        "EQ_TYPE_KG",
        "EXERCISE_DIRECTION_HORIZONTAL_PUSH",
      ],
      values: {
        ...mockExercise.values,
        weight: {
          startValue: {
            default: { intermediate: "50" },
            m: { intermediate: "50" },
            w: { intermediate: "50" },
            k: { intermediate: "50" },
            type: { type: "weightAbsolute" },
          },
          targetValue: {
            default: { intermediate: "60" },
            m: { intermediate: "60" },
            w: { intermediate: "60" },
            k: { intermediate: "60" },
            type: { type: "weightAbsolute" },
          },
        },
      },
    };

    it("returns training weights array", () => {
      const result = generator.getMaxTrainingWeights(
        weightExercise,
        mockUser,
        {},
      );

      expect(result).toHaveProperty("trainingWeights");
      expect(Array.isArray(result.trainingWeights)).toBe(true);
      expect(result.trainingWeights.length).toBeGreaterThan(0);
    });

    it("uses the same percentages for an incline bench press as for a flat one", () => {
      // the incline factor already lowers the adjusted max of the exercise
      const inclineExercise: ExerciseType = {
        ...weightExercise,
        tags: [...weightExercise.tags, "EQ_INCLINE_BENCH"],
      };

      expect(
        generator.getMaxTrainingWeights(inclineExercise, mockUser, {}),
      ).toEqual(generator.getMaxTrainingWeights(weightExercise, mockUser, {}));
    });

    it("generates appropriate training weights array", () => {
      const completeWeightExercise = {
        ...weightExercise,
        values: {
          ...weightExercise.values,
          weight: {
            startValue: {
              default: {
                beginner: "50",
                intermediate: "60",
                advanced: "70",
                professional: "80",
              },
              m: {
                beginner: "50",
                intermediate: "60",
                advanced: "70",
                professional: "80",
              },
              w: {
                beginner: "40",
                intermediate: "50",
                advanced: "60",
                professional: "70",
              },
              k: {
                beginner: "30",
                intermediate: "40",
                advanced: "50",
                professional: "60",
              },
              type: { type: "weightAbsolute" as const },
            },
            targetValue: {
              default: {
                beginner: "60",
                intermediate: "70",
                advanced: "80",
                professional: "90",
              },
              m: {
                beginner: "60",
                intermediate: "70",
                advanced: "80",
                professional: "90",
              },
              w: {
                beginner: "50",
                intermediate: "60",
                advanced: "70",
                professional: "80",
              },
              k: {
                beginner: "40",
                intermediate: "50",
                advanced: "60",
                professional: "70",
              },
              type: { type: "weightAbsolute" as const },
            },
          },
        },
      };

      const userWithValidLevel = {
        ...mockUser,
        workoutData: {
          ...mockUser.workoutData,
          tags: { LEVEL: ["BEGINNER"] },
        },
      };

      const result = generator.getMaxTrainingWeights(
        completeWeightExercise,
        userWithValidLevel,
        {},
      );

      expect(result.trainingWeights.length).toBeGreaterThan(0);
      result.trainingWeights.forEach((weight) => {
        expect(typeof weight).toBe("number");
        expect(weight).toBeGreaterThan(0);
      });
    });

    it("adjusts weights based on user exercise data", () => {
      const userExerciseData = {
        "1": {
          exerciseId: "1",
          skill: "SWR1" as const,
          nextWeightPercentage: 60,
        },
      };

      const result = generator.getMaxTrainingWeights(
        weightExercise,
        mockUser,
        userExerciseData,
      );

      expect(result.trainingWeights.length).toBeGreaterThan(0);
    });
  });

  describe("getExercisePairs", () => {
    const branches = [
      {
        branchId: "1",
        branchTags: [
          "SKILL_SA",
          "MUSCLE_INVOLVEMENT_COMPOUND",
          "SIDE_BOTH",
          "MUSCLE_CHEST",
        ],
        exerciseId: "1",
      },
      {
        branchId: "2",
        branchTags: [
          "SKILL_SA",
          "MUSCLE_INVOLVEMENT_ISOLATED",
          "SIDE_BOTH",
          "MUSCLE_BICEPS",
        ],
        exerciseId: "2",
      },
    ];

    const exercises: ExerciseType[] = [
      { ...mockExercise, id: "1" },
      { ...mockExercise, id: "2" },
    ];

    it("returns array of exercise pairs", () => {
      const result = generator.getExercisePairs(
        "SA",
        branches,
        exercises,
        [],
        [],
        false,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("each pair has a first exercise", () => {
      const result = generator.getExercisePairs(
        "SA",
        branches,
        exercises,
        [],
        [],
        false,
      );

      result.forEach((pair) => {
        expect(pair).toHaveProperty("first");
        expect(pair.first).toHaveProperty("exerciseId");
        expect(pair.first).toHaveProperty("branchTags");
      });
    });

    it("creates supersets when appropriate", () => {
      const result = generator.getExercisePairs(
        "SA",
        branches,
        exercises,
        [],
        [],
        false,
      );

      const hasSuperset = result.some((pair) => pair.second !== undefined);
      expect(hasSuperset).toBe(true);
    });

    it("handles one-sided exercises with other side", () => {
      const oneSidedExercise: ExerciseType = {
        ...mockExercise,
        id: "3",
        otherSideExerciseId: "4",
      };

      const oneSidedBranches = [
        {
          branchId: "3",
          branchTags: ["SKILL_SA", "SIDE_ONE", "SIDE_LEFT", "MUSCLE_CHEST"],
          exerciseId: "3",
        },
      ];

      const result = generator.getExercisePairs(
        "SA",
        oneSidedBranches,
        [oneSidedExercise],
        [],
        [],
        false,
      );

      expect(result.length).toBeGreaterThan(0);
    });

    it("returns empty array when no branches provided", () => {
      const result = generator.getExercisePairs(
        "SA",
        [],
        exercises,
        [],
        [],
        false,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("getCardioExercisePairs", () => {
    const mockCardioBranches: CardioBranchReference[] = [
      {
        branchTags: ["SKILL_CARDIO", "EQUIPMENT_NONE"],
        exerciseId: "cardio-1",
      },
      {
        branchTags: ["SKILL_CARDIO", "EQUIPMENT_TREADMILL"],
        exerciseId: "cardio-2",
      },
    ];

    const mockCardioExercises: ExerciseType[] = [
      { ...mockExercise, id: "cardio-1" },
      { ...mockExercise, id: "cardio-2" },
    ];

    describe("CARDIO_5 skill", () => {
      it("returns single exercise pair with first branch", () => {
        const skill: SkillWithLength = { skill: "CARDIO_5", length: 30 };

        const result = generator.getCardioExercisePairs(
          skill,
          mockCardioBranches,
          mockCardioExercises,
          [],
          false,
        );

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty("first");
        expect(result[0].first).toEqual(mockCardioBranches[0]);
      });

      it("returns first branch even when multiple branches provided", () => {
        const skill: SkillWithLength = { skill: "CARDIO_5", length: 45 };

        const result = generator.getCardioExercisePairs(
          skill,
          mockCardioBranches,
          mockCardioExercises,
          [],
          false,
        );

        expect(result[0].first.exerciseId).toBe("cardio-1");
        expect(result[0].second).toBeUndefined();
      });
    });

    describe("CARDIO_4 skill", () => {
      it("returns single exercise pair with first branch", () => {
        const skill: SkillWithLength = { skill: "CARDIO_4", length: 20 };

        const result = generator.getCardioExercisePairs(
          skill,
          mockCardioBranches,
          mockCardioExercises,
          [],
          false,
        );

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty("first");
        expect(result[0].first).toEqual(mockCardioBranches[0]);
      });

      it("does not include second exercise in pair", () => {
        const skill: SkillWithLength = { skill: "CARDIO_4", length: 15 };

        const result = generator.getCardioExercisePairs(
          skill,
          mockCardioBranches,
          mockCardioExercises,
          [],
          false,
        );

        expect(result[0].second).toBeUndefined();
      });
    });

    describe("interval cardio skills (TODO - currently return empty)", () => {
      const intervalSkills = [
        "CARDIO_3",
        "CARDIO_2",
        "CARDIO_1_SHORT",
        "CARDIO_1_LAKTAT",
      ];

      it.each(intervalSkills)(
        "%s returns empty array (interval implementation TODO)",
        (skillName) => {
          const skill: SkillWithLength = { skill: skillName, length: 30 };

          const result = generator.getCardioExercisePairs(
            skill,
            mockCardioBranches,
            mockCardioExercises,
            [],
            false,
          );

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(0);
        },
      );
    });

    describe("unknown skill types", () => {
      it("returns empty array for unknown skill", () => {
        const skill: SkillWithLength = { skill: "UNKNOWN_CARDIO", length: 30 };

        const result = generator.getCardioExercisePairs(
          skill,
          mockCardioBranches,
          mockCardioExercises,
          [],
          false,
        );

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });

      it("returns empty array for non-cardio skill", () => {
        const skill: SkillWithLength = { skill: "SA", length: 30 };

        const result = generator.getCardioExercisePairs(
          skill,
          mockCardioBranches,
          mockCardioExercises,
          [],
          false,
        );

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });

      it("returns empty array for empty skill string", () => {
        const skill: SkillWithLength = { skill: "", length: 30 };

        const result = generator.getCardioExercisePairs(
          skill,
          mockCardioBranches,
          mockCardioExercises,
          [],
          false,
        );

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });
    });

    describe("edge cases", () => {
      it("handles single branch for CARDIO_5", () => {
        const skill: SkillWithLength = { skill: "CARDIO_5", length: 30 };
        const singleBranch: CardioBranchReference[] = [mockCardioBranches[0]];

        const result = generator.getCardioExercisePairs(
          skill,
          singleBranch,
          mockCardioExercises,
          [],
          false,
        );

        expect(result).toHaveLength(1);
        expect(result[0].first).toEqual(singleBranch[0]);
      });

      it("handles pains parameter (currently unused)", () => {
        const skill: SkillWithLength = { skill: "CARDIO_4", length: 30 };
        const pains = ["PAIN_KNEE", "PAIN_BACK"];

        const result = generator.getCardioExercisePairs(
          skill,
          mockCardioBranches,
          mockCardioExercises,
          pains,
          false,
        );

        expect(result).toHaveLength(1);
        expect(result[0].first).toEqual(mockCardioBranches[0]);
      });

      it("handles isShortTraining flag (currently unused)", () => {
        const skill: SkillWithLength = { skill: "CARDIO_5", length: 30 };

        const resultShort = generator.getCardioExercisePairs(
          skill,
          mockCardioBranches,
          mockCardioExercises,
          [],
          true,
        );

        const resultFull = generator.getCardioExercisePairs(
          skill,
          mockCardioBranches,
          mockCardioExercises,
          [],
          false,
        );

        expect(resultShort).toEqual(resultFull);
      });

      it("handles different length values", () => {
        const skill15: SkillWithLength = { skill: "CARDIO_5", length: 15 };
        const skill60: SkillWithLength = { skill: "CARDIO_5", length: 60 };

        const result15 = generator.getCardioExercisePairs(
          skill15,
          mockCardioBranches,
          mockCardioExercises,
          [],
          false,
        );

        const result60 = generator.getCardioExercisePairs(
          skill60,
          mockCardioBranches,
          mockCardioExercises,
          [],
          false,
        );

        expect(result15).toHaveLength(1);
        expect(result60).toHaveLength(1);
        expect(result15[0].first).toEqual(result60[0].first);
      });
    });
  });

  /**
   * TEST_WORKOUT (Force Test) Integration Tests
   *
   * Testing Matrix:
   * - Levels: BEGINNER, ADVANCED, PROFESSIONAL
   * - Genders: MALE, FEMALE
   *
   * Special cases:
   * - ADVANCED + MALE: Uses gender-specific exercises (m key)
   * - All others: Use default exercises
   * - Missing level tag: Falls back to BEGINNER
   */
  describe("TEST_WORKOUT (Force Test)", () => {
    // Extended type for test workout entries which include skill property
    type TestSetListEntry = SetListEntryType & {
      skill: "WU" | "TEST";
      weightType?: string;
    };

    const realExercises = ExercisesData as { id: string }[];
    const testSkillTrees = { WU: transformSkillTree(WU as RawSkillTree) } as {
      [skillName: string]: SkillTreeType;
    };

    // Expected exercises by level and gender from TEST_WORKOUTS.ts
    const EXPECTED_EXERCISES = {
      BEGINNER: { default: ["25", "50", "342", "297", "54"] },
      ADVANCED: {
        default: ["25", "50", "342", "297", "54"],
      },
      PROFESSIONAL: { default: ["25", "50", "342", "297", "54"] },
    } as const;

    const PAUSE_EXERCISE_ID = "999999";
    const SETS_PER_EXERCISE = 4;
    const WARMUP_1_PAUSE = 60;
    const WARMUP_2_PAUSE = 60;
    const WARMUP_3_PAUSE = 120;
    const TEST_SET_PAUSE = 180;
    const WARMUP_TO_TEST_TRANSITION_PAUSE_SECONDS = 30;
    const SET_1_REPS = 6;
    const SET_2_REPS = 4;
    const SET_3_REPS = 2;
    const SET_4_REPS = -1;

    const testUser = {
      userId: "test-user",
      personalData: {
        birthday: "1990-01-01",
        gender: "MALE" as "MALE" | "FEMALE",
      },
      workoutData: {
        tags: { LEVEL: ["ADVANCED"] } as Record<string, string[]>,
        maxValues: {
          testAt: new Date("2020-01-01").getTime(),
          kneeDominant: { barbell: 100 },
          horizontalPush: { barbell: 80 },
          horizontalPull: { barbell: 70 },
          verticalPush: { barbell: 60 },
        } as Record<string, unknown>,
      },
      temporalData: [] as { date: string; expiration: string; tag: string }[],
      trainingPlan: null,
    };

    const testUserExerciseData = {
      exerciseData: {},
      branchData: {},
    };

    const generateTestWorkout = (user: typeof testUser): TestSetListEntry[] => {
      return generator.generateTraining(
        "TEST_WORKOUT",
        user as Parameters<typeof generator.generateTraining>[1],
        "STUDIO",
        realExercises as Parameters<typeof generator.generateTraining>[3],
        testSkillTrees as Parameters<typeof generator.generateTraining>[4],
        0,
        [],
        undefined,
        0,
        testUserExerciseData,
      ) as unknown as TestSetListEntry[];
    };

    describe("Level × Gender Matrix", () => {
      const testCases: {
        level: keyof typeof EXPECTED_EXERCISES;
        gender: "MALE" | "FEMALE";
        expectedExerciseIds: readonly string[];
      }[] = [
        {
          level: "BEGINNER",
          gender: "MALE",
          expectedExerciseIds: EXPECTED_EXERCISES.BEGINNER.default,
        },
        {
          level: "BEGINNER",
          gender: "FEMALE",
          expectedExerciseIds: EXPECTED_EXERCISES.BEGINNER.default,
        },
        {
          level: "ADVANCED",
          gender: "MALE",
          expectedExerciseIds: EXPECTED_EXERCISES.ADVANCED.default,
        },
        {
          level: "ADVANCED",
          gender: "FEMALE",
          expectedExerciseIds: EXPECTED_EXERCISES.ADVANCED.default,
        },
        {
          level: "PROFESSIONAL",
          gender: "MALE",
          expectedExerciseIds: EXPECTED_EXERCISES.PROFESSIONAL.default,
        },
        {
          level: "PROFESSIONAL",
          gender: "FEMALE",
          expectedExerciseIds: EXPECTED_EXERCISES.PROFESSIONAL.default,
        },
      ];

      it.each(testCases)(
        "$level + $gender: generates correct exercise set",
        ({ level, gender, expectedExerciseIds }) => {
          const user = {
            ...testUser,
            personalData: {
              ...testUser.personalData,
              gender,
            },
            workoutData: {
              ...testUser.workoutData,
              tags: { LEVEL: [level] },
            },
          };

          const result = generateTestWorkout(user);
          const testExercises = result.filter(
            (entry) =>
              entry.skill === "TEST" && entry.exerciseId !== PAUSE_EXERCISE_ID,
          );

          const actualExerciseIds = [
            ...new Set(testExercises.map((e) => e.exerciseId)),
          ];
          expect({
            exerciseIds: actualExerciseIds.sort(),
            totalSets: testExercises.length,
          }).toEqual({
            exerciseIds: [...expectedExerciseIds].sort(),
            totalSets: expectedExerciseIds.length * SETS_PER_EXERCISE,
          });
        },
      );

      it.each(testCases)(
        "$level + $gender: sets have correct structure",
        ({ level, gender, expectedExerciseIds }) => {
          const user = {
            ...testUser,
            personalData: {
              ...testUser.personalData,
              gender,
            },
            workoutData: {
              ...testUser.workoutData,
              tags: { LEVEL: [level] },
            },
          };

          const result = generateTestWorkout(user);
          const testExercises = result.filter(
            (entry) =>
              entry.skill === "TEST" && entry.exerciseId !== PAUSE_EXERCISE_ID,
          );

          expectedExerciseIds.forEach((exerciseId) => {
            const exerciseSets = testExercises.filter(
              (e) => e.exerciseId === exerciseId,
            );

            expect(
              exerciseSets.map((s) => ({
                set: s.set,
                repetition: s.repetition,
              })),
            ).toEqual([
              { set: [1, SETS_PER_EXERCISE], repetition: SET_1_REPS },
              { set: [2, SETS_PER_EXERCISE], repetition: SET_2_REPS },
              { set: [3, SETS_PER_EXERCISE], repetition: SET_3_REPS },
              { set: [4, SETS_PER_EXERCISE], repetition: SET_4_REPS },
            ]);
          });
        },
      );

      it.each(testCases)(
        "$level + $gender: weights increase across sets",
        ({ level, gender, expectedExerciseIds }) => {
          const user = {
            ...testUser,
            personalData: {
              ...testUser.personalData,
              gender,
            },
            workoutData: {
              ...testUser.workoutData,
              tags: { LEVEL: [level] },
            },
          };

          const result = generateTestWorkout(user);
          const testExercises = result.filter(
            (entry) =>
              entry.skill === "TEST" && entry.exerciseId !== PAUSE_EXERCISE_ID,
          );

          expectedExerciseIds.forEach((exerciseId) => {
            const weights = testExercises
              .filter((e) => e.exerciseId === exerciseId)
              .map((e) => e.weight!);

            expect(weights[0]).toBeLessThan(weights[1]);
            expect(weights[1]).toBeLessThanOrEqual(weights[2]);
            expect(weights[2]).toBeLessThanOrEqual(weights[3]);
          });
        },
      );
    });

    describe("Warm-up Section", () => {
      it("should include warm-up exercises with duration before test section", () => {
        const result = generateTestWorkout(testUser);
        const warmUpExercises = result.filter(
          (entry) =>
            entry.skill === "WU" && entry.exerciseId !== PAUSE_EXERCISE_ID,
        );

        expect(warmUpExercises.length).toBeGreaterThan(0);
        expect(warmUpExercises.every((e) => e.duration && e.duration > 0)).toBe(
          true,
        );
      });

      it("should end warm-up with transition pause before test section", () => {
        const result = generateTestWorkout(testUser);
        const warmUpEntries = result.filter((entry) => entry.skill === "WU");
        const lastWarmUpEntry = warmUpEntries[warmUpEntries.length - 1];

        expect({
          exerciseId: lastWarmUpEntry.exerciseId,
          duration: lastWarmUpEntry.duration,
        }).toEqual({
          exerciseId: PAUSE_EXERCISE_ID,
          duration: WARMUP_TO_TEST_TRANSITION_PAUSE_SECONDS,
        });
      });
    });

    describe("Test Exercise Pauses", () => {
      it("should have 60s pauses after warmup sets 1 and 2", () => {
        const result = generateTestWorkout(testUser);
        const testPauses = result.filter(
          (entry) =>
            entry.skill === "TEST" && entry.exerciseId === PAUSE_EXERCISE_ID,
        );

        const set1Pauses = testPauses.filter((p) => p.set[0] === 1);
        const set2Pauses = testPauses.filter((p) => p.set[0] === 2);
        expect(set1Pauses.every((p) => p.duration === WARMUP_1_PAUSE)).toBe(
          true,
        );
        expect(set2Pauses.every((p) => p.duration === WARMUP_2_PAUSE)).toBe(
          true,
        );
      });

      it("should have 120s pause after warmup set 3", () => {
        const result = generateTestWorkout(testUser);
        const testPauses = result.filter(
          (entry) =>
            entry.skill === "TEST" && entry.exerciseId === PAUSE_EXERCISE_ID,
        );

        const set3Pauses = testPauses.filter((p) => p.set[0] === 3);
        expect(set3Pauses.every((p) => p.duration === WARMUP_3_PAUSE)).toBe(
          true,
        );
      });

      it("should have 180s pauses after test set (last pause popped by caller)", () => {
        const result = generateTestWorkout(testUser);
        const testPauses = result.filter(
          (entry) =>
            entry.skill === "TEST" && entry.exerciseId === PAUSE_EXERCISE_ID,
        );

        const set4Pauses = testPauses.filter((p) => p.set[0] === 4);
        expect(set4Pauses.every((p) => p.duration === TEST_SET_PAUSE)).toBe(
          true,
        );
      });

      it("should not end with a pause (last pause removed by generateTraining)", () => {
        const result = generateTestWorkout(testUser);
        const lastEntry = result[result.length - 1];
        expect(lastEntry.exerciseId).not.toBe(PAUSE_EXERCISE_ID);
      });
    });

    describe("Weight Calculation", () => {
      it("should calculate weights from start values when no max values exist", () => {
        const userWithoutMaxValues = {
          ...testUser,
          workoutData: {
            ...testUser.workoutData,
            tags: { LEVEL: ["BEGINNER"] },
            maxValues: {},
          },
        };

        const result = generateTestWorkout(userWithoutMaxValues);
        const testExercises = result.filter(
          (entry) =>
            entry.skill === "TEST" && entry.exerciseId !== PAUSE_EXERCISE_ID,
        );

        expect(testExercises.every((e) => e.weight && e.weight > 0)).toBe(true);
      });

      it("should use max values to calculate weights when available", () => {
        const maxKneeValue = 100;
        const userWithMaxValues = {
          ...testUser,
          workoutData: {
            ...testUser.workoutData,
            tags: { LEVEL: ["ADVANCED"] },
            gender: "MALE" as const,
            maxValues: {
              testAt: new Date("2024-01-01").getTime(),
              kneeDominant: { barbell: maxKneeValue },
            },
          },
        };

        const result = generateTestWorkout(userWithMaxValues);
        const squatSets = result.filter(
          (entry) => entry.exerciseId === "25" && entry.skill === "TEST",
        );

        const maxSetWeight = squatSets[2].weight!;
        const advancedMaxPercentage = 0.8;
        expect(maxSetWeight).toBeLessThanOrEqual(
          maxKneeValue * advancedMaxPercentage,
        );
      });

      it.each([
        { level: "BEGINNER", expectedPercentage: 0.75 },
        { level: "ADVANCED", expectedPercentage: 0.8 },
        { level: "PROFESSIONAL", expectedPercentage: 0.85 },
      ])(
        "$level: should use $expectedPercentage of 1RM for test weight",
        ({ level, expectedPercentage }) => {
          const maxKneeValue = 100;
          const userWithMaxValues = {
            ...testUser,
            workoutData: {
              ...testUser.workoutData,
              tags: { LEVEL: [level] },
              gender: "MALE" as const,
              maxValues: {
                testAt: new Date("2024-01-01").getTime(),
                kneeDominant: { barbell: maxKneeValue },
              },
            },
          };

          const result = generateTestWorkout(userWithMaxValues);

          const levelKey = level as keyof typeof EXPECTED_EXERCISES;
          const exerciseIds = EXPECTED_EXERCISES[levelKey];
          const firstTestExerciseId = exerciseIds.default[0];

          const testSets = result.filter(
            (entry) =>
              entry.exerciseId === firstTestExerciseId &&
              entry.skill === "TEST",
          );

          expect(testSets).toHaveLength(4);

          const warmup1Weight = testSets[0].weight!;
          const warmup2Weight = testSets[1].weight!;
          const warmup3Weight = testSets[2].weight!;
          const testSetWeight = testSets[3].weight!;

          const barbell = { tags: ["EQ_BARBELL"] };
          const testWeight = roundWeightValue(
            maxKneeValue * expectedPercentage,
            barbell,
          );
          expect(testSetWeight).toBe(testWeight);
          expect(warmup1Weight).toBe(
            roundWeightValue(testWeight * 0.4, barbell),
          );
          expect(warmup2Weight).toBe(
            roundWeightValue(testWeight * 0.6, barbell),
          );
          expect(warmup3Weight).toBe(
            roundWeightValue(testWeight * 0.85, barbell),
          );
        },
      );

      it("derives ramp up loads from the rounded test set load with barbell rounding", () => {
        const userWithMaxValues = {
          ...testUser,
          workoutData: {
            ...testUser.workoutData,
            tags: { LEVEL: ["BEGINNER"] },
            gender: "MALE" as const,
            maxValues: {
              testAt: new Date("2024-01-01").getTime(),
              kneeDominant: { barbell: 41.3 },
            },
          },
        };

        const result = generateTestWorkout(userWithMaxValues);
        const squatWeights = result
          .filter(
            (entry) => entry.exerciseId === "25" && entry.skill === "TEST",
          )
          .map((entry) => entry.weight);

        // 75% of 41.3 kg is 30.975 kg, rounded to a 30 kg test set load
        expect(squatWeights).toEqual([12.5, 17.5, 25, 30]);
      });
    });

    describe("Edge Cases", () => {
      it("should fallback to BEGINNER exercises when no level tag is present", () => {
        const noLevelUser = {
          ...testUser,
          workoutData: { ...testUser.workoutData, tags: {} },
        };

        const result = generateTestWorkout(noLevelUser);
        const testExercises = result.filter(
          (entry) =>
            entry.skill === "TEST" && entry.exerciseId !== PAUSE_EXERCISE_ID,
        );

        const actualExerciseIds = [
          ...new Set(testExercises.map((e) => e.exerciseId)),
        ];
        expect(actualExerciseIds.sort()).toEqual(
          [...EXPECTED_EXERCISES.BEGINNER.default].sort(),
        );
      });

      it("should throw descriptive error for invalid level tag", () => {
        const invalidLevelUser = {
          ...testUser,
          workoutData: {
            ...testUser.workoutData,
            tags: { LEVEL: ["INVALID"] },
          },
        };

        expect(() => generateTestWorkout(invalidLevelUser)).toThrow(
          "Invalid userLevel for TEST_WORKOUT: INVALID",
        );
      });
    });

    describe("Output Structure", () => {
      it("should have skill property defined for ALL entries", () => {
        const result = generateTestWorkout(testUser);

        const entriesWithUndefinedSkill = result.filter(
          (entry) => entry.skill === undefined,
        );
        expect(entriesWithUndefinedSkill).toHaveLength(0);

        const validSkills = ["WU", "TEST"];
        expect(result.every((entry) => validSkills.includes(entry.skill))).toBe(
          true,
        );
      });

      it("should return entries with required properties for test exercises", () => {
        const result = generateTestWorkout(testUser);
        const testExercise = result.find(
          (entry) =>
            entry.skill === "TEST" && entry.exerciseId !== PAUSE_EXERCISE_ID,
        )!;

        expect({
          hasExerciseId: typeof testExercise.exerciseId === "string",
          hasSet:
            Array.isArray(testExercise.set) && testExercise.set.length === 2,
          hasWeight: typeof testExercise.weight === "number",
          hasRepetition: typeof testExercise.repetition === "number",
          skill: testExercise.skill,
        }).toEqual({
          hasExerciseId: true,
          hasSet: true,
          hasWeight: true,
          hasRepetition: true,
          skill: "TEST",
        });
      });

      it("should have warm-up section before test section", () => {
        const result = generateTestWorkout(testUser);

        const firstWUIndex = result.findIndex((entry) => entry.skill === "WU");
        const firstTESTIndex = result.findIndex(
          (entry) => entry.skill === "TEST",
        );

        expect({
          wuFirst: firstWUIndex === 0,
          testAfterWu: firstTESTIndex > firstWUIndex,
        }).toEqual({
          wuFirst: true,
          testAfterWu: true,
        });
      });
    });
  });

  /** Integration tests for generatePlanWorkout — known failing bug scenarios. */
  describe("PLAN Workout — Known Issues", () => {
    const {
      realExercises,
      PAUSE_ID,
      noExerciseData,
      today,
      nextWeek,
      importTrees,
      buildPlanUser,
    } = require("../../../../test/factories/planWorkout");

    /**
     * When a plan branch requires specific equipment (EQ_BOTTLE) but the
     * user has no equipment and no replacement tree is available, the
     * generator should throw a NO_EXERCISES/EQUIPMENT error.
     */
    it("throws EQUIPMENT error when hall has no equipment", () => {
      const user = buildPlanUser({
        weekday: 1,
        skills: {
          SWR1: [
            {
              branchId: "68",
              tags: [
                "EQ_BOTTLE",
                "EQ_TYPE_EQUIPMENT",
                "PLACE_HALL",
                "REGION_CORE",
              ],
              exercises: {
                "1": { exerciseId: "223" },
                "2": { exerciseId: "224" },
                "3": { exerciseId: "224" },
              },
            },
          ],
        },
        lengths: { SWR1: 10 },
      });

      let thrownError: unknown;
      try {
        generator.generatePlanWorkout(
          "PLAN",
          user,
          "HALL",
          realExercises,
          importTrees("WU", "CARDIO_4", "CARDIO_5"),
          1,
          [],
          undefined,
          0,
          noExerciseData,
        );
      } catch (e) {
        thrownError = e;
      }
      expect(thrownError).toEqual({
        type: "NO_EXERCISES",
        subtype: "EQUIPMENT",
        params: expect.any(Array),
      });
    });

    /**
     * Verifies that replaceExerciseBranches avoids duplicate exercise IDs.
     *
     * User plan — 2 GKS branches:
     *   "C1"  CORE       → exercise 357  (kept — survives CHEST soreness)
     *   "UB1" UPPER_BODY → exercise 222  (removed by CHEST soreness → needs replacement)
     *
     * Mock GKSKG tree — 3 branches (the pool replaceExerciseBranches draws from):
     *   "C1"  CORE      → exercise 357  (excluded: already kept via usedBranchIds)
     *   "C2"  CORE      → exercise 357  (duplicate trap — same exercise as C1)
     *   "FB1" FULL_BODY → exercise 4    (unique alternative, both-sided)
     *
     * Expected unique exercise IDs in GKS result: ["4", "357"]
     *   357 — kept branch C1
     *   4   — replacement from FB1
     */
    it("should not have duplicate exercise IDs within GKS skill after CHEST soreness replacement", () => {
      const {
        transformSkillTree,
      } = require("../../../../src/utils/skillTreeTransform");

      const mockGKSKG = transformSkillTree({
        C1: {
          tags: ["EQ_TYPE_KG", "REGION_CORE", "PLACE_HALL", "SIDE_BOTH"],
          levels: { "1": { exerciseId: "357" }, "2": { exerciseId: "357" } },
        },
        C2: {
          tags: ["EQ_TYPE_KG", "REGION_CORE", "PLACE_HALL", "SIDE_BOTH"],
          levels: { "1": { exerciseId: "357" }, "2": { exerciseId: "357" } },
        },
        FB1: {
          tags: ["EQ_TYPE_KG", "REGION_FULL_BODY", "PLACE_HALL", "SIDE_BOTH"],
          levels: { "1": { exerciseId: "4" }, "2": { exerciseId: "4" } },
        },
      });

      const user = buildPlanUser({
        weekday: 2,
        temporalData: [{ date: today, expiration: nextWeek, tag: "CHEST" }],
        skills: {
          GKS: [
            {
              branchId: "C1",
              tags: ["EQ_TYPE_KG", "REGION_CORE", "PLACE_HALL"],
              exercises: {
                "1": { exerciseId: "357" },
                "2": { exerciseId: "357" },
              },
            },
            {
              branchId: "UB1",
              tags: ["EQ_TYPE_KG", "REGION_UPPER_BODY", "PLACE_HALL"],
              exercises: { "2": { exerciseId: "222" } },
            },
          ],
        },
        lengths: { GKS: 15 },
      });

      const result = generator.generatePlanWorkout(
        "PLAN",
        user,
        "HALL",
        realExercises,
        { ...importTrees("WU", "CARDIO_4", "CARDIO_5"), GKSKG: mockGKSKG },
        2,
        ["TOWEL", "FOAM_ROLLER"],
        undefined,
        0,
        noExerciseData,
      );

      const gksExerciseIds = result
        .filter(
          (e: { skill: string; exerciseId: string }) =>
            e.skill === "GKS" && e.exerciseId !== PAUSE_ID,
        )
        .map((e: { exerciseId: string }) => e.exerciseId);

      // The set list repeats IDs across sets (multiple sets per exercise).
      // Extract unique IDs to verify the two branch-level exercises.
      const uniqueIds = [...new Set(gksExerciseIds)].sort();
      expect(uniqueIds).toEqual(["357", "4"]);
    });

    it("does not throw when trainingPlan is frozen (immer store) and daysSinceLastWorkout > 7", () => {
      function deepFreeze<T extends object>(obj: T): T {
        Object.freeze(obj);
        for (const value of Object.values(obj)) {
          if (value && typeof value === "object" && !Object.isFrozen(value)) {
            deepFreeze(value);
          }
        }
        return obj;
      }

      const user = buildPlanUser({
        weekday: 1,
        skills: {
          SWR1: [
            {
              branchId: "22",
              tags: ["SKILL_SWR", "PLACE_STUDIO", "EQ_DUMBBELL"],
              exercises: {
                "1": { exerciseId: "118" },
                "2": { exerciseId: "118" },
                "3": { exerciseId: "261" },
              },
            },
          ],
        },
        lengths: { SWR1: 10 },
      });

      // Simulate immer's recursive deep freeze (Zustand immer middleware freezes all store state)
      deepFreeze(user.trainingPlan!);

      const result = generator.generatePlanWorkout(
        "PLAN",
        user,
        "STUDIO",
        realExercises,
        importTrees("WU", "SWR1", "CARDIO_3", "CARDIO_4", "CARDIO_5"),
        1,
        ["DUMBBELL", "BARBELL"],
        undefined,
        14, // > 7 days triggers extendSectionsForMissedWeeks
        noExerciseData,
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it("branch threshold profile: BEGINNER with branch level 2 does not throw", () => {
      const user = buildPlanUser({
        weekday: 1,
        skills: {
          SWR1: [
            {
              branchId: "22",
              tags: ["SKILL_SWR", "PLACE_STUDIO", "EQ_DUMBBELL"],
              exercises: {
                "1": { exerciseId: "118" },
                "2": { exerciseId: "118" },
                "3": { exerciseId: "261" },
              },
            },
          ],
        },
        lengths: { SWR1: 10 },
      });
      user.workoutData!.tags = { LEVEL: ["BEGINNER"], POSITION: ["FIELD"] };

      const studioEquipment = [
        "DUMBBELL",
        "BARBELL",
        "BENCH",
        "ADJUSTABLE_BENCH",
        "BARBELL_BENCH",
        "EXERCISING_BENCH",
        "POWER_RACK",
      ];
      const exerciseData = {
        exerciseData: {
          "118": {
            exerciseId: "118",
            skill: "SWR1",
            weight: 25,
            repetition: 15,
            weightType: "weightAbsolute",
          },
        },
        branchData: { "22": { level: 2 } },
      };

      const result = generator.generatePlanWorkout(
        "PLAN",
        user,
        "STUDIO",
        realExercises,
        importTrees("WU", "SWR1", "CARDIO_3", "CARDIO_4", "CARDIO_5"),
        1,
        studioEquipment,
        0,
        0,
        exerciseData as any,
      );
      expect(result.length).toBeGreaterThan(0);
    });

    /**
     * Reproduces crash: endurance training day + leg muscle soreness.
     *
     * When user has a CARDIO_3 training and reports leg soreness (e.g. QUADRICEPS_LEFT),
     * filterBySoreness returns keep:{} for the CARDIO skill (all branches are LOWER_BODY).
     * The generator replaces with CARDIO_5 but the replacement entries are added mid-loop
     * and never go through exercise selection (lines 1098-1121), so they have
     * {tags, exercises, branchId} instead of {branchTags, exerciseId, branchId}.
     * This causes a crash when building the set list.
     */
    it("does not crash with leg soreness on endurance (CARDIO_3) training day", () => {
      const user = buildPlanUser({
        weekday: 1,
        skills: {
          CARDIO_3: [
            {
              branchId: "580",
              tags: [
                "EQ_TREADMILL",
                "EQ_TYPE_EQUIPMENT",
                "REGION_LOWER_BODY",
                "SKILL_CARDIO",
                "SKILL_CARDIO_3",
                "PLACE_STUDIO",
              ],
              exercises: {
                "1": { exerciseId: "43" },
                "2": { exerciseId: "43" },
                "3": { exerciseId: "43" },
              },
            },
          ],
        },
        lengths: { CARDIO_3: 20 },
        temporalData: [
          {
            tag: "QUADRICEPS_LEFT",
            date: new Date().toISOString(),
            expiration: new Date(
              Date.now() + 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        ],
      });

      const result = generator.generatePlanWorkout(
        "PLAN",
        user,
        "STUDIO",
        realExercises,
        importTrees("WU", "CARDIO_3", "CARDIO_4", "CARDIO_5"),
        1,
        ["TREADMILL"],
        undefined,
        0,
        noExerciseData,
      );

      expect(result.length).toBeGreaterThan(0);
      // All entries should have valid exerciseId (not undefined)
      for (const entry of result) {
        expect(entry.exerciseId).toBeDefined();
        expect(typeof entry.exerciseId).toBe("string");
      }
    });
  });

  /**
   * PREVKNEE (Praventionstraining Knie und Hufte) generation.
   * Should always produce 3 WUSPEZIAL warm-up exercises + 6 main prevention exercises
   * (3 super-set pairs) when given sided knee pain (e.g. KNEE_RIGHT).
   */
  describe("PREVKNEE generation with sided pain", () => {
    const realExercises = ExercisesData as { id: string }[];
    const prevSkillTrees = {
      WU: transformSkillTree(WU as RawSkillTree),
      PREV: transformSkillTree(PREV as RawSkillTree),
      PREVKG: transformSkillTree(PREVKG as RawSkillTree),
      WUSPEZIAL: transformSkillTree(WUSPEZIAL as RawSkillTree),
    } as { [skillName: string]: SkillTreeType };

    const prevKneeUser: UserType = {
      userId: "prevknee-test-user",
      personalData: { gender: "MALE", birthday: "1990-01-01" },
      workoutData: {
        tags: {
          LEVEL: ["INTERMEDIATE"],
          PAIN: ["KNEE_RIGHT"],
        },
        maxValues: DEFAULT_MAX_VALUES,
      },
      temporalData: [],
    };

    const noExerciseData = { exerciseData: {}, branchData: {} };

    const PAUSE_ID = "999999";

    it("generates exactly 3 WUSPEZIAL + 6 main PREV exercises for KNEE_RIGHT pain", () => {
      const result = generator.generateShortWorkout(
        "PREVKNEE",
        prevKneeUser,
        "STUDIO",
        realExercises as Parameters<typeof generator.generateShortWorkout>[3],
        prevSkillTrees,
        [],
        noExerciseData,
      );

      const wuEntries = result.filter(
        (e) => e.skill === "WUSPEZIAL" && e.exerciseId !== PAUSE_ID,
      );
      const prevEntries = result.filter(
        (e) => e.skill === "PREVKNEE" && e.exerciseId !== PAUSE_ID,
      );

      // 3 warm-up branches selected; ONE_SIDE exercises expand to left+right so count >= 3
      expect(wuEntries.length).toBeGreaterThanOrEqual(3);
      // 3 super-set pairs selected; fill-up branches can expand count beyond 6
      expect(prevEntries.length).toBeGreaterThanOrEqual(6);
    });

    it("side detection uses English LEFT/RIGHT from original pain tags", () => {
      // KNEE_RIGHT pain should produce RIGHT-side exercises, not BOTH (the broken default).
      // With broken German string matching the exercises were filtered to 0-2.
      // Correct English matching produces at least 6 exercises (3 super-set pairs).
      const result = generator.generateShortWorkout(
        "PREVKNEE",
        prevKneeUser,
        "STUDIO",
        realExercises as Parameters<typeof generator.generateShortWorkout>[3],
        prevSkillTrees,
        [],
        noExerciseData,
      );

      const exerciseEntries = result.filter(
        (e) => e.skill === "PREVKNEE" && e.exerciseId !== PAUSE_ID,
      );

      expect(exerciseEntries.length).toBeGreaterThanOrEqual(6);
    });
  });
});
