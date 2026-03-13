/**
 * Factory helpers for generatePlanWorkout integration tests.
 *
 * Provides minimal test data builders so specs stay focused on
 * the behaviour under test rather than setup boilerplate.
 */
import type { UserType } from "@/schemas/user.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
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

export interface PlanUserOverrides {
  weekday: number;
  skills: Record<string, unknown[]>;
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
