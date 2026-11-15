import type { CatalogRest, Superset } from "@/schemas/aiwl.schema";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import { readSkillCatalogEntry } from "../generationInput/skillCatalogEntry";

/** The sets, superset and rests a training day gives a skill. */
export interface TrainingDayTiming {
  sets: number;
  superset: Superset;
  rest: CatalogRest;
}

const TRAINING_DAY_FALLBACK_TIMING: TrainingDayTiming = {
  sets: 2,
  superset: "muscles",
  rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
};

/**
 * Reads the defaults of a skill in a training day, field by field: the skill
 * catalog entry, else 2 sets, a superset by muscles and 10 s rests. A catalog
 * rest sets all three rests, so it replaces the fallback whole, afterBlock
 * included.
 *
 * readTrainingDayTimingDefaults("WUSPEZIAL", loadSkillCatalog())
 * → { sets: 1, superset: "muscles",
 *     rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10, afterBlock: 30 } }
 */
export const readTrainingDayTimingDefaults = (
  skill: string,
  skillCatalog: SkillCatalog,
): TrainingDayTiming => {
  const entry = readSkillCatalogEntry(skillCatalog, skill);
  return {
    sets: entry?.sets ?? TRAINING_DAY_FALLBACK_TIMING.sets,
    superset: entry?.superset ?? TRAINING_DAY_FALLBACK_TIMING.superset,
    rest: entry?.rest ?? TRAINING_DAY_FALLBACK_TIMING.rest,
  };
};
