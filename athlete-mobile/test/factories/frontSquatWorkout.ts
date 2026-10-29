import type { ExerciseProgressRecordType } from "@/features/training/models/ExerciseProgress";
import type { Template } from "@/schemas/aiwl.schema";
import type {
  SkillCode,
  UserExerciseDataMapType,
} from "@/schemas/generator.schema";
import type { UserType } from "@/schemas/user.schema";
import type { generateWorkout } from "@/features/training/workoutGeneratorRouter";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { generateAdultMalePersonalData } from "./completionAthlete";
import { buildPlanUser, realExercises } from "./planWorkout";
import { generateStoredExerciseData } from "./storedExerciseData";
import { generateBranchesBlock, generateTemplate } from "./templateBlock";

/** The dumbbell front squat, the exercise on every level of SWR1 branch 22 that an advanced athlete trains. */
export const FRONT_SQUAT_EXERCISE_ID = "118";

const STUDIO_EQUIPMENT = [
  "DUMBBELL",
  "BARBELL",
  "BENCH",
  "ADJUSTABLE_BENCH",
  "BARBELL_BENCH",
  "EXERCISING_BENCH",
  "POWER_RACK",
];

/** The studio branch of the front squat in the SWR1 skill tree. */
export const FRONT_SQUAT_BRANCH_ID = "22";

/**
 * Builds the stored front squat of one skill, with its weight in kilograms.
 * The overrides replace any field.
 *
 * generateFrontSquatRecord("SA", { weight: 20, repetition: 9 })
 * → { exerciseId: "118", skill: "SA", weightType: "weightAbsolute", weight: 20, repetition: 9 }
 */
export const generateFrontSquatRecord = (
  skill: SkillCode,
  overrides: Partial<ExerciseProgressRecordType> = {},
): ExerciseProgressRecordType =>
  generateStoredExerciseData({
    exerciseId: FRONT_SQUAT_EXERCISE_ID,
    skill,
    weightType: "weightAbsolute",
    ...overrides,
  });

/**
 * Branch data that pins the front squat branch to level 2, so every workout of
 * the branch trains the front squat.
 *
 * generateFrontSquatBranchData()
 * → { "22": { branchId: "22", level: 2, exerciseId: "118" } }
 */
export const generateFrontSquatBranchData =
  (): UserExerciseDataMapType["branchData"] => ({
    [FRONT_SQUAT_BRANCH_ID]: {
      branchId: FRONT_SQUAT_BRANCH_ID,
      level: 2,
      exerciseId: FRONT_SQUAT_EXERCISE_ID,
    },
  });

/**
 * Builds an advanced athlete whose plan trains the front squat branch under
 * SWR1 for 10 minutes on the weekday, after the default warm up.
 *
 * generateFrontSquatPlanUser(4)
 * → user with a training on weekday 4: skills { WU: [branch 410], SWR1: [branch 22] }, lengths { WU: 5, SWR1: 10 }
 */
export const generateFrontSquatPlanUser = (weekday: number): UserType => ({
  ...buildPlanUser({
    weekday,
    skills: {
      SWR1: [
        {
          branchId: FRONT_SQUAT_BRANCH_ID,
          tags: ["SKILL_SWR", "PLACE_STUDIO", "EQ_DUMBBELL"],
          exercises: {
            "1": { exerciseId: FRONT_SQUAT_EXERCISE_ID },
            "2": { exerciseId: FRONT_SQUAT_EXERCISE_ID },
            "3": { exerciseId: "261" },
          },
        },
      ],
    },
    lengths: { SWR1: 10 },
  }),
  personalData: generateAdultMalePersonalData(),
});

/**
 * Builds a short workout template of one branches block: the front squat
 * branch trained under the given skill.
 *
 * generateFrontSquatTemplate("own", "SA")
 * → { aiwl: 1, id: "own", name: { en: "own" }, blocks: [{ kind: "branches", skill: "SA", branches: ["22"], duration: 600 }] }
 */
export const generateFrontSquatTemplate = (
  id: string,
  skill: SkillCode,
): Template =>
  generateTemplate([generateBranchesBlock(skill, [FRONT_SQUAT_BRANCH_ID])], {
    id,
    name: { en: id },
  });

/**
 * Builds the request of a workout in a studio with dumbbells and a barbell,
 * for the whole skill catalog and the exercise catalog. The weekday is Monday
 * unless given, and the section the one of the day.
 *
 * generateStudioWorkoutRequest("PLAN", generateFrontSquatPlanUser(1), { exerciseProgress: {}, exerciseData: {}, branchData: {} })
 * → { type: "PLAN", user, place: "STUDIO", equipment: ["DUMBBELL", ...], weekday: 1,
 *     userExerciseData: { exerciseProgress: {}, exerciseData: {}, branchData: {} }, ... }
 */
export const generateStudioWorkoutRequest = (
  type: string,
  user: UserType,
  userExerciseData: UserExerciseDataMapType,
  weekday = 1,
): Parameters<typeof generateWorkout>[0] => ({
  type,
  user,
  place: "STUDIO",
  exercises: realExercises,
  skillTrees: getAllSkillTrees(),
  weekday,
  equipment: STUDIO_EQUIPMENT,
  givenSection: undefined,
  daysSinceLastWorkout: 0,
  userExerciseData,
});
