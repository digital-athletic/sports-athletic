import type { CatalogRest, Rest, Superset } from "@/schemas/aiwl.schema";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import { readSkillCatalogEntry } from "../generationInput/skillCatalogEntry";

/** The sets, superset and rests a training day gives a skill. */
export interface TrainingDayTiming {
  sets: number;
  superset: Superset;
  rest: Required<
    Pick<Rest, "withinSuperset" | "betweenSets" | "afterExercise">
  >;
}

const TRAINING_DAY_FALLBACK_TIMING: TrainingDayTiming = {
  sets: 2,
  superset: "muscles",
  rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
};

// A catalog rest sets all three rests, so it replaces the fallback whole. The
// catalog afterBlock stays out, because the standard builder reads it itself.
const readTrainingDayRest = (
  rest: CatalogRest | undefined,
): TrainingDayTiming["rest"] =>
  rest
    ? {
        withinSuperset: rest.withinSuperset,
        betweenSets: rest.betweenSets,
        afterExercise: rest.afterExercise,
      }
    : TRAINING_DAY_FALLBACK_TIMING.rest;

/**
 * Reads the defaults of a skill in a training day, field by field: the skill
 * catalog entry, else 2 sets, a superset by muscles and 10 s rests.
 *
 * readTrainingDayTimingDefaults("MAX", loadSkillCatalog())
 * → { sets: 4, superset: "none",
 *     rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 180 } }
 */
export const readTrainingDayTimingDefaults = (
  skill: string,
  skillCatalog: SkillCatalog,
): TrainingDayTiming => {
  const entry = readSkillCatalogEntry(skillCatalog, skill);
  return {
    sets: entry?.sets ?? TRAINING_DAY_FALLBACK_TIMING.sets,
    superset: entry?.superset ?? TRAINING_DAY_FALLBACK_TIMING.superset,
    rest: readTrainingDayRest(entry?.rest),
  };
};
