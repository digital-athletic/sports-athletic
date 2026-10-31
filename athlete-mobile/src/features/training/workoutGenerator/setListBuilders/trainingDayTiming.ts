import type { Rest, Superset } from "@/schemas/aiwl.schema";
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

interface TrainingDayTimingOverride {
  sets?: number;
  superset?: Superset;
  rest?: Partial<TrainingDayTiming["rest"]>;
}

/**
 * The values stored training plans need where the skill catalog sets none:
 * cardio intervals and PLYO, which has no catalog entry of its own.
 */
const TRAINING_DAY_TIMING_OVERRIDES = new Map<
  string,
  TrainingDayTimingOverride
>([
  [
    "CARDIO_1_SHORT",
    {
      sets: 10,
      superset: "none",
      rest: { withinSuperset: 50, afterExercise: 50 },
    },
  ],
  [
    "CARDIO_1_LAKTAT",
    {
      sets: 4,
      superset: "none",
      rest: { withinSuperset: 240, afterExercise: 240 },
    },
  ],
  [
    "CARDIO_2",
    {
      sets: 8,
      superset: "none",
      rest: { withinSuperset: 60, afterExercise: 60 },
    },
  ],
  [
    "CARDIO_3",
    {
      sets: 6,
      superset: "none",
      rest: { withinSuperset: 60, afterExercise: 60 },
    },
  ],
  ["CARDIO_4", { sets: 1, superset: "none" }],
  ["CARDIO_5", { sets: 1, superset: "none" }],
  [
    "PLYO",
    {
      sets: 2,
      superset: "muscles",
      rest: { withinSuperset: 60, betweenSets: 180, afterExercise: 60 },
    },
  ],
]);

const TRAINING_DAY_FALLBACK_TIMING: TrainingDayTiming = {
  sets: 2,
  superset: "muscles",
  rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
};

/**
 * Reads the defaults of a skill in a training day, field by field: the
 * training day override, then the skill catalog entry, then 2 sets, a
 * superset by muscles and 10 s rests.
 *
 * readTrainingDayTimingDefaults("MAX", loadSkillCatalog())
 * → { sets: 4, superset: "none",
 *     rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 180 } }
 */
export const readTrainingDayTimingDefaults = (
  skill: string,
  skillCatalog: SkillCatalog,
): TrainingDayTiming => {
  const layers: TrainingDayTimingOverride[] = [
    TRAINING_DAY_TIMING_OVERRIDES.get(skill) ?? {},
    readSkillCatalogEntry(skillCatalog, skill) ?? {},
  ];
  const fallback = TRAINING_DAY_FALLBACK_TIMING;
  const readFirst = <T>(
    read: (layer: TrainingDayTimingOverride) => T | undefined,
  ) => layers.map(read).find((value) => value !== undefined);
  return {
    sets: readFirst((layer) => layer.sets) ?? fallback.sets,
    superset: readFirst((layer) => layer.superset) ?? fallback.superset,
    rest: {
      withinSuperset:
        readFirst((layer) => layer.rest?.withinSuperset) ??
        fallback.rest.withinSuperset,
      betweenSets:
        readFirst((layer) => layer.rest?.betweenSets) ??
        fallback.rest.betweenSets,
      afterExercise:
        readFirst((layer) => layer.rest?.afterExercise) ??
        fallback.rest.afterExercise,
    },
  };
};
