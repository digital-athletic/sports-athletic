/**
 * Factory helpers for generatePlanWorkout integration tests.
 *
 * Provides minimal test data builders so specs stay focused on
 * the behaviour under test rather than setup boilerplate.
 */
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { generateWorkout } from "@/features/training/workoutGeneratorRouter";
import type { UserType } from "@/schemas/user.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { addDays, formatDateToISO } from "@/utils/date";
import {
  transformSkillTree,
  type RawSkillTree,
} from "@/utils/skillTreeTransform";
import ExercisesData from "../../assets/data/generator/Exercises.json";

/** All exercises from the real dataset, typed. */
export const realExercises = ExercisesData as ExerciseType[];

/** Pause-exercise sentinel ID used by the generator. */
export const PAUSE_ID = "999999";

/** Empty user exercise data (no prior progress). */
export const noExerciseData = { exerciseData: {}, branchData: {} } as const;

/** Load a real skill tree JSON by name. */
export function importTree(name: string): SkillTreeType {
  const raw = require(`../../assets/data/generator/skillTrees/${name}.json`);
  return transformSkillTree(raw as RawSkillTree);
}

/** Load multiple skill trees by name into a record. */
export function importTrees(...names: string[]): Record<string, SkillTreeType> {
  return Object.fromEntries(names.map((n) => [n, importTree(n)]));
}

/** Today as YYYY-MM-DD. */
export const today = new Date().toISOString().split("T")[0];

/** One week from today as YYYY-MM-DD. */
export const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

/** Plan start 7 days ago — ensures getSectionForDate picks section 0. */
const planStart = new Date();
planStart.setUTCHours(0, 0, 0, 0);
planStart.setUTCDate(planStart.getUTCDate() - 7);
const planStartISO = planStart.toISOString();
const planStartDate = planStartISO.split("T")[0];

/** Bodyweight warm-up branch reusable across tests. */
const wuBranch = {
  branchId: "410",
  tags: ["SKILL_WARM_UP", "PLACE_HALL", "REGION_LOWER_BODY", "EQ_TYPE_KG"],
  exercises: {
    "1": { exerciseId: "431" },
    "2": { exerciseId: "432" },
    "3": { exerciseId: "432" },
  },
};

/**
 * Bottle branch of a core skill, reusable where a day needs equipment the
 * place lacks.
 *
 * generateBottleBranch("68", "SKILL_HYPERTROPHY")
 * → { branchId: "68", tags: ["EQ_BOTTLE", ..., "SKILL_HYPERTROPHY"], exercises: { "1": { exerciseId: "223" }, ... } }
 */
export function generateBottleBranch(branchId: string, skillTag: string) {
  return {
    branchId,
    tags: [
      "EQ_BOTTLE",
      "EQ_TYPE_EQUIPMENT",
      "PLACE_HALL",
      "REGION_CORE",
      skillTag,
    ],
    exercises: {
      "1": { exerciseId: "223" },
      "2": { exerciseId: "224" },
      "3": { exerciseId: "224" },
    },
  };
}

/**
 * Prevention branch with warm-up exercises on every level, as a catalog tree
 * holds it (`levels`).
 *
 * generatePreventionBranch("810", "SHOULDER", "EQ_TYPE_KG")
 * → { branchId: "810", tags: ["PREVENTION_SHOULDER", "SKILL_PREVENTION", "REGION_LOWER_BODY", "EQ_TYPE_KG"], levels: { "1": { exerciseId: "431" }, ... } }
 */
export function generatePreventionBranch(
  branchId: string,
  region: string,
  equipment: string,
) {
  return {
    tags: [
      `PREVENTION_${region}`,
      "SKILL_PREVENTION",
      "REGION_LOWER_BODY",
      equipment,
    ],
    levels: {
      "1": { exerciseId: "431" },
      "2": { exerciseId: "432" },
      "3": { exerciseId: "432" },
    },
    branchId,
  };
}

/**
 * Stored day entries for the first knee-hip prevention branches of a real
 * skill tree that hold at least one level.
 *
 * generateKneePreventionBranches("PREV", 2)
 * → [{ branchId: "152", tags: ["PREVENTION_KNEE_HIP", ...], exercises: { "1": { exerciseId: "1149" }, ... } }, ...]
 */
export function generateKneePreventionBranches(tree: string, count: number) {
  return Object.entries(importTree(tree))
    .filter(
      ([, branch]) =>
        branch.tags.includes("PREVENTION_KNEE_HIP") &&
        Object.keys(branch.levels).length > 0,
    )
    .slice(0, count)
    .map(([branchId, branch]) => ({
      branchId,
      tags: branch.tags,
      exercises: Object.fromEntries(
        Object.entries(branch.levels).map(([level, data]) => [
          level,
          { exerciseId: data.exerciseId },
        ]),
      ),
    }));
}

export interface PlanUserOverrides {
  weekday: number;
  skills: Record<string, unknown>;
  lengths: Record<string, number>;
  temporalData?: { date: string; expiration: string; tag: string }[];
}

/**
 * Build a minimal user with a single-section, single-training plan.
 * Only the fields that generatePlanWorkout actually reads are populated.
 */
export function buildPlanUser(overrides: PlanUserOverrides): UserType {
  return {
    userId: "test-user",
    workoutData: {
      tags: { LEVEL: ["ADVANCED"] } as Record<string, string[]>,
    },
    temporalData: overrides.temporalData ?? [],
    trainingPlan: {
      start: planStartISO,
      sections: [
        {
          start: planStartDate,
          numOfWeeks: 3,
          type: "SWR1",
          cardioType: "CARDIO_3",
          trainings: [
            {
              weekday: overrides.weekday,
              skills: { WU: [wuBranch], ...overrides.skills },
              lengths: { WU: 5, ...overrides.lengths },
              focus: "CARDIO",
            },
          ],
        },
      ],
    },
  } as UserType;
}

/**
 * Plan user with two sections whose Monday trainings differ only in warm up
 * minutes: the first section started two weeks ago and runs two weeks, the
 * second starts today.
 *
 * generateTwoSectionPlanUser()
 * → user with section 0 lengths { WU: 5 } and section 1 lengths { WU: 7 }
 */
export function generateTwoSectionPlanUser(): UserType {
  const section = (start: Date, numOfWeeks: number, minutes: number) => ({
    start: formatDateToISO(start),
    numOfWeeks,
    type: "SWR1",
    cardioType: "CARDIO_3",
    trainings: [
      {
        weekday: 1,
        skills: { WU: [wuBranch] },
        lengths: { WU: minutes },
        focus: "CARDIO",
      },
    ],
  });
  const firstStart = addDays(new Date(), -14);
  return {
    ...generateWarmUpOnlyPlanUser(),
    trainingPlan: {
      start: firstStart.toISOString(),
      sections: [section(firstStart, 2, 5), section(new Date(), 3, 7)],
    },
  } as UserType;
}

/**
 * Plan user whose Monday training holds the default warm-up and nothing else.
 *
 * generateWarmUpOnlyPlanUser()
 * → user with skills { WU: [branch 410] } and lengths { WU: 5 } on weekday 1
 */
export function generateWarmUpOnlyPlanUser(): UserType {
  return buildPlanUser({ weekday: 1, skills: {}, lengths: {} });
}

export interface PlanWorkoutOptions {
  weekday?: number;
  place?: string;
  equipment?: string[];
  skillTrees?: Record<string, SkillTreeType>;
}

/**
 * Generates the set list of the user's training of one weekday (default
 * Monday, 1) through the workout generator router, with no earlier progress.
 * Defaults: place HALL, no equipment, trees WU, CARDIO_4, CARDIO_5.
 *
 * generatePlanWorkoutForWeekday(generateWarmUpOnlyPlanUser())
 * → [{ skill: "WU", branchId: "410", exerciseId: "431", set: [1, 2], ... }, ...]
 */
export function generatePlanWorkoutForWeekday(
  user: UserType,
  options: PlanWorkoutOptions = {},
): GeneratedSetListEntry[] {
  return generateWorkout({
    type: "PLAN",
    user,
    place: options.place ?? "HALL",
    exercises: realExercises,
    skillTrees: options.skillTrees ?? importTrees("WU", "CARDIO_4", "CARDIO_5"),
    weekday: options.weekday ?? 1,
    equipment: options.equipment ?? [],
    givenSection: undefined,
    daysSinceLastWorkout: 0,
    userExerciseData: noExerciseData,
  });
}
