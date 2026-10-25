import type { Rest, Superset } from "@/schemas/aiwl.schema";

/** The sets, superset and rests a plan workout gives a skill. */
export interface PlanWorkoutTiming {
  sets: number;
  superset: Superset;
  rest: Rest;
}

const PREVENTION_SKILLS = [
  "PREV",
  "PREVSHOULDER",
  "PREVKNEE",
  "PREVWRIST",
  "PREVANKLE",
  "PREVSPINE",
];
const POWER_ENDURANCE_SKILLS = ["SWR1", "SWR2", "SWR1KG", "SWR2KG"];

/**
 * Builds a lookup table that gives every listed skill the same value.
 *
 * assignSkillValue(["SA", "SAKG"], 75) → [["SA", 75], ["SAKG", 75]]
 */
const assignSkillValue = (
  skills: readonly string[],
  value: number,
): [string, number][] => skills.map((skill) => [skill, value]);

const SETS_BY_SKILL = new Map([
  ["CARDIO_1_SHORT", 10],
  ["CARDIO_1_LAKTAT", 4],
  ["CARDIO_2", 8],
  ["CARDIO_3", 6],
  ...assignSkillValue(
    ["CARDIO_4", "CARDIO_5", "WU", "WUSKSA", "WUSPEZIAL", "CD", "MOB", "BR"],
    1,
  ),
  ...assignSkillValue(["MAX", "MAX_STRENGTH"], 4),
]);

const SKILLS_WITHOUT_SUPERSET = new Set([
  "CARDIO_1_SHORT",
  "CARDIO_1_LAKTAT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
  "GKSKG",
  "SAS",
  "GKS",
  "MAX",
  "MAX_STRENGTH",
]);

const WITHIN_SUPERSET_REST_BY_SKILL = new Map([
  ["CARDIO_1_SHORT", 50],
  ["CARDIO_1_LAKTAT", 240],
  ...assignSkillValue(["CARDIO_2", "CARDIO_3", "SK", "SKKG", "PLYO"], 60),
  ...assignSkillValue(
    [
      ...POWER_ENDURANCE_SKILLS,
      "BAS",
      "STABILITY",
      ...PREVENTION_SKILLS,
      "WUSKSA",
    ],
    30,
  ),
  ...assignSkillValue(["GKS", "GKSKG"], 45),
  ...assignSkillValue(["SA", "SAKG"], 75),
]);

const BETWEEN_SETS_REST_BY_SKILL = new Map([
  ...assignSkillValue([...POWER_ENDURANCE_SKILLS, "GKS", "GKSKG"], 90),
  ...assignSkillValue(["BAS", "STABILITY", ...PREVENTION_SKILLS], 60),
  ...assignSkillValue(["SK", "SKKG", "SA", "SAKG", "PLYO"], 180),
  ["WUSKSA", 30],
]);

const AFTER_EXERCISE_REST_BY_SKILL = new Map([
  ["CARDIO_1_SHORT", 50],
  ["CARDIO_1_LAKTAT", 240],
  ...assignSkillValue(
    [
      "CARDIO_2",
      "CARDIO_3",
      ...POWER_ENDURANCE_SKILLS,
      "BAS",
      "STABILITY",
      ...PREVENTION_SKILLS,
      "GKS",
      "GKSKG",
      "SK",
      "SKKG",
      "PLYO",
    ],
    60,
  ),
  ...assignSkillValue(["SA", "SAKG"], 75),
  ...assignSkillValue(["MAX", "MAX_STRENGTH"], 180),
  ...assignSkillValue(["WUSKSA", "WU"], 30),
]);

const DEFAULT_SETS = 2;
const DEFAULT_REST = 10;

/**
 * Reads the sets, superset and rests of a skill in a plan workout. Skills
 * missing from a table get 2 sets, a superset by muscles and 10 s rests.
 *
 * readPlanWorkoutTiming("GKS")
 * → { sets: 2, superset: "none",
 *     rest: { withinSuperset: 45, betweenSets: 90, afterExercise: 60 } }
 */
export const readPlanWorkoutTiming = (skill: string): PlanWorkoutTiming => ({
  sets: SETS_BY_SKILL.get(skill) ?? DEFAULT_SETS,
  superset: SKILLS_WITHOUT_SUPERSET.has(skill) ? "none" : "muscles",
  rest: {
    withinSuperset: WITHIN_SUPERSET_REST_BY_SKILL.get(skill) ?? DEFAULT_REST,
    betweenSets: BETWEEN_SETS_REST_BY_SKILL.get(skill) ?? DEFAULT_REST,
    afterExercise: AFTER_EXERCISE_REST_BY_SKILL.get(skill) ?? DEFAULT_REST,
  },
});
