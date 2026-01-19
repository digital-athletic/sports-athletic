import type { UserType } from "@/features/profile/models/User";
import type { ExerciseType } from "@/features/training/models/Exercise";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { SetListEntryType } from "@/features/training/models/SetListEntry";
import type { SkillTreeType } from "@/store/skillTreesStore";
import { fieldNamesToLowerCase } from "@/utils/fieldNames";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import WU from "../../../../assets/data/generator/skillTrees/WU.json";
import TrainingGenerator from "./TrainingGenerator";

describe("TrainingGenerator", () => {
  let generator: TrainingGenerator;

  const mockUser: UserType = {
    userId: "test-user-id",
    workoutData: {
      birthday: "1990-01-01",
      gender: "MALE",
      tags: ["LEVEL_INTERMEDIATE"],
      maxValues: DEFAULT_MAX_VALUES,
    },
    temporalData: [],
  };

  const mockExercise: ExerciseType = {
    id: 1,
    name: "Test Exercise",
    displayName: "Test Exercise",
    description: "Test Description",
    picture: "test.jpg",
    video: "test.mp4",
    level: { m: 1, w: 1 },
    tags: [
      "SKILL_WU",
      "REGION_OBERKOERPER",
      "EQUIPMENT_NONE",
      "SIDE_BOTH",
      "MUSCLEINVOLVEMENT_COMPOUND",
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
      expect(generator.getAfterSetPauseBySkill("WU")).toBe(10);
    });

    it("returns correct pause for SA", () => {
      expect(generator.getAfterSetPauseBySkill("SA")).toBe(180);
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

    it("throws error for null", () => {
      expect(() => generator.isEmptyOrUndefined(null)).toThrow();
    });

    it("returns false for array", () => {
      expect(generator.isEmptyOrUndefined([])).toBe(false);
    });
  });

  describe("getAdjustmentByUserData", () => {
    it("returns default adjustment when no intensity provided", () => {
      const adjustment = generator.getAdjustmentByUserData(
        null,
        "MALE",
        "INTERMEDIATE",
      );

      expect(adjustment).toHaveProperty("duration");
      expect(adjustment).toHaveProperty("height");
      expect(adjustment).toHaveProperty("repetition");
      expect(adjustment).toHaveProperty("weightFMax");
      expect(adjustment).toHaveProperty("weightAbsolute");

      expect(adjustment.duration.SUCCEEDED).toBe(5);
      expect(adjustment.duration.TOO_EASY).toBe(10);
      expect(adjustment.duration.TOO_HARD).toBe(-5);

      expect(adjustment.repetition.SUCCEEDED).toBe(2);
      expect(adjustment.repetition.TOO_EASY).toBe(4);
      expect(adjustment.repetition.TOO_HARD).toBe(-2);

      expect(adjustment.weightAbsolute.SUCCEEDED).toBe(1);
      expect(adjustment.weightAbsolute.TOO_EASY).toBe(2);
      expect(adjustment.weightAbsolute.TOO_HARD).toBe(-1);
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
      };

      const adjustment = generator.getAdjustmentByUserData(
        customIntensity,
        "m",
        "intermediate",
      );

      expect(adjustment.duration.SUCCEEDED).toBe(10);
      expect(adjustment.duration.TOO_EASY).toBe(20);
      expect(adjustment.duration.TOO_HARD).toBe(-10);

      expect(adjustment.repetition.SUCCEEDED).toBe(3);
      expect(adjustment.repetition.TOO_EASY).toBe(6);
      expect(adjustment.repetition.TOO_HARD).toBe(-3);
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
        repetition: 15,
        weight: 20,
        duration: null,
        height: null,
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
      weightType: "weightAbsolute",
    };

    const mockUserExercise = {
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

    it("increases height on TOO_EASY feedback for jump exercises", () => {
      const result = generator.adjustExerciseValues(
        baseData,
        mockUserExercise,
        { ...mockExercise, isJump: true },
        null,
        "m",
        "intermediate",
        "TOO_EASY",
      );

      expect(result.height).toBeGreaterThan(baseData.height);
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
  });

  describe("getExerciseStartValues", () => {
    it("returns proper structure with all required fields", () => {
      const result = generator.getExerciseStartValues(
        "WU",
        {
          branchTags: mockExercise.tags,
          exerciseId: 1,
          branchId: 1,
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
          exerciseId: 1,
          branchId: 1,
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
          exerciseId: 1,
          branchId: 1,
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
          exerciseId: 1,
          branchId: 1,
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
          exerciseId: 1,
          branchId: 1,
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
  });

  describe("getMaxTrainingWeights", () => {
    const weightExercise: ExerciseType = {
      ...mockExercise,
      tags: [
        ...mockExercise.tags,
        "EQTYPE_KG",
        "EXERCISEDIRECTION_HORIZONTAL_PUSH",
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

    it("returns incline bench weight difference", () => {
      const result = generator.getMaxTrainingWeights(
        weightExercise,
        mockUser,
        {},
      );

      expect(result).toHaveProperty("inclineBenchWeightDifference");
      expect(typeof result.inclineBenchWeightDifference).toBe("number");
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
              type: { type: "weightAbsolute" },
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
              type: { type: "weightAbsolute" },
            },
          },
        },
      };

      const userWithValidLevel = {
        ...mockUser,
        workoutData: {
          ...mockUser.workoutData,
          tags: ["LEVEL_BEGINNER"],
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
        1: {
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
        branchId: 1,
        branchTags: [
          "SKILL_SA",
          "MUSCLEINVOLVEMENT_COMPOUND",
          "SIDE_BOTH",
          "MUSCLE_BRUST",
        ],
        exerciseId: 1,
      },
      {
        branchId: 2,
        branchTags: [
          "SKILL_SA",
          "MUSCLEINVOLVEMENT_ISOLATED",
          "SIDE_BOTH",
          "MUSCLE_BIZEPS",
        ],
        exerciseId: 2,
      },
    ];

    const exercises: ExerciseType[] = [
      { ...mockExercise, id: 1 },
      { ...mockExercise, id: 2 },
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
        id: 3,
        otherSideExerciseId: 4 as number,
      };

      const oneSidedBranches = [
        {
          branchId: 3,
          branchTags: ["SKILL_SA", "SIDE_ONE", "SIDE_LEFT", "MUSCLE_BRUST"],
          exerciseId: 3,
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

    const realExercises = fieldNamesToLowerCase(ExercisesData) as {
      id: number;
    }[];
    const testSkillTrees = { WU: WU };

    // Expected exercises by level and gender from TEST_WORKOUTS.ts
    const EXPECTED_EXERCISES = {
      BEGINNER: { default: [25, 7, 88, 317] },
      ADVANCED: { default: [25, 7, 297, 317], m: [25, 342, 297, 54] },
      PROFESSIONAL: { default: [25, 342, 297, 54] },
    } as const;

    const PAUSE_EXERCISE_ID = 999999;
    const SETS_PER_EXERCISE = 3;
    const STANDARD_PAUSE_SECONDS = 60;
    const FINAL_SET_PAUSE_SECONDS = 120;
    const WARMUP_TO_TEST_TRANSITION_PAUSE_SECONDS = 30;
    const SET_1_REPS = 12;
    const SET_2_REPS = 8;
    const SET_3_REPS = -1;

    const testUser = {
      userId: "test-user",
      workoutData: {
        birthday: "01.01.1990",
        gender: "MALE" as "MALE" | "FEMALE",
        tags: ["LEVEL_ADVANCED"] as string[],
        maxValues: {
          testDate: "01-01-2020",
          knee: { barbell: 100 },
          horizontalPush: { barbell: 80 },
          horizontalPull: { barbell: 70 },
          verticalPush: { barbell: 60 },
        } as Record<string, unknown>,
      },
      temporalData: [] as { tag: string }[],
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
        expectedExerciseIds: readonly number[];
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
          expectedExerciseIds: EXPECTED_EXERCISES.ADVANCED.m,
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
            workoutData: {
              ...testUser.workoutData,
              gender,
              tags: [`LEVEL_${level}`],
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
            exerciseIds: actualExerciseIds.sort((a, b) => a - b),
            totalSets: testExercises.length,
          }).toEqual({
            exerciseIds: [...expectedExerciseIds].sort((a, b) => a - b),
            totalSets: expectedExerciseIds.length * SETS_PER_EXERCISE,
          });
        },
      );

      it.each(testCases)(
        "$level + $gender: sets have correct structure",
        ({ level, gender, expectedExerciseIds }) => {
          const user = {
            ...testUser,
            workoutData: {
              ...testUser.workoutData,
              gender,
              tags: [`LEVEL_${level}`],
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
            ]);
          });
        },
      );

      it.each(testCases)(
        "$level + $gender: weights increase across sets",
        ({ level, gender, expectedExerciseIds }) => {
          const user = {
            ...testUser,
            workoutData: {
              ...testUser.workoutData,
              gender,
              tags: [`LEVEL_${level}`],
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
            expect(weights[1]).toBeLessThan(weights[2]);
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
      it("should have standard pauses after sets 1 and 2", () => {
        const result = generateTestWorkout(testUser);
        const testPauses = result.filter(
          (entry) =>
            entry.skill === "TEST" && entry.exerciseId === PAUSE_EXERCISE_ID,
        );

        const set1And2Pauses = testPauses.filter(
          (p) => p.set[0] === 1 || p.set[0] === 2,
        );
        expect(
          set1And2Pauses.every((p) => p.duration === STANDARD_PAUSE_SECONDS),
        ).toBe(true);
      });

      it("should have doubled pauses after final set (max effort recovery)", () => {
        const result = generateTestWorkout(testUser);
        const testPauses = result.filter(
          (entry) =>
            entry.skill === "TEST" && entry.exerciseId === PAUSE_EXERCISE_ID,
        );

        const set3Pauses = testPauses.filter((p) => p.set[0] === 3);
        expect(
          set3Pauses.every((p) => p.duration === FINAL_SET_PAUSE_SECONDS),
        ).toBe(true);
      });
    });

    describe("Weight Calculation", () => {
      it("should calculate weights from start values when no max values exist", () => {
        const userWithoutMaxValues = {
          ...testUser,
          workoutData: {
            ...testUser.workoutData,
            tags: ["LEVEL_BEGINNER"],
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
            tags: ["LEVEL_ADVANCED"],
            gender: "MALE" as const,
            maxValues: {
              testDate: "01-01-2024",
              knee: { barbell: maxKneeValue },
            },
          },
        };

        const result = generateTestWorkout(userWithMaxValues);
        const squatSets = result.filter(
          (entry) => entry.exerciseId === 25 && entry.skill === "TEST",
        );

        const maxSetWeight = squatSets[2].weight!;
        const advancedMaxPercentage = 0.65;
        expect(maxSetWeight).toBeLessThanOrEqual(
          maxKneeValue * advancedMaxPercentage,
        );
      });
    });

    describe("Edge Cases", () => {
      it("should fallback to BEGINNER exercises when no level tag is present", () => {
        const noLevelUser = {
          ...testUser,
          workoutData: { ...testUser.workoutData, tags: [] },
        };

        const result = generateTestWorkout(noLevelUser);
        const testExercises = result.filter(
          (entry) =>
            entry.skill === "TEST" && entry.exerciseId !== PAUSE_EXERCISE_ID,
        );

        const actualExerciseIds = [
          ...new Set(testExercises.map((e) => e.exerciseId)),
        ];
        expect(actualExerciseIds.sort((a, b) => a - b)).toEqual(
          [...EXPECTED_EXERCISES.BEGINNER.default].sort((a, b) => a - b),
        );
      });

      it("should throw descriptive error for invalid level tag", () => {
        const invalidLevelUser = {
          ...testUser,
          workoutData: { ...testUser.workoutData, tags: ["LEVEL_INVALID"] },
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
          hasExerciseId: typeof testExercise.exerciseId === "number",
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
});
