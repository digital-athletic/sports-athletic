import type { Block, Superset } from "@/schemas/aiwl.schema";
import type { SkillCatalogEntry } from "@/schemas/skillCatalog.schema";
import type { SetListBlock } from "./setListBuilder";

/** The values a block falls back to where it sets none of its own. */
export type SkillTimingDefaults = Pick<
  SkillCatalogEntry,
  "sets" | "superset" | "rest"
>;

/** The sets, superset, rests and values a block builds its set list with. */
export interface ResolvedBlockTiming
  extends Pick<SetListBlock, "sets" | "rest" | "setDuration" | "values"> {
  readonly superset: Superset;
}

const requireTimingValue = <T>(
  skill: string,
  field: string,
  own: T | undefined,
  fallback: T | undefined,
): T => {
  const value = own ?? fallback;
  if (value === undefined) {
    throw new Error(`${field}: skill ${skill} sets no default`);
  }
  return value;
};

/**
 * Resolves the timing of a block: each value of the block itself, else the
 * default. afterBlock comes from the block only, because the standard builder
 * reads the skill catalog's afterBlock itself.
 *
 * resolveBlockTiming({ skill: "GKS", rest: { betweenSets: 15 }, ... }, readPlanWorkoutTiming("GKS"))
 * → { sets: 2, superset: "none",
 *     rest: { withinSuperset: 45, betweenSets: 15, afterExercise: 60, afterBlock: undefined },
 *     setDuration: undefined, values: undefined }
 */
export const resolveBlockTiming = (
  block: Block,
  defaults: SkillTimingDefaults | undefined,
): ResolvedBlockTiming => {
  const { skill } = block;
  const rest = block.rest ?? {};
  return {
    sets: requireTimingValue(skill, "sets", block.sets, defaults?.sets),
    superset: requireTimingValue(
      skill,
      "superset",
      block.superset,
      defaults?.superset,
    ),
    rest: {
      withinSuperset: requireTimingValue(
        skill,
        "rest.withinSuperset",
        rest.withinSuperset,
        defaults?.rest?.withinSuperset,
      ),
      betweenSets: requireTimingValue(
        skill,
        "rest.betweenSets",
        rest.betweenSets,
        defaults?.rest?.betweenSets,
      ),
      afterExercise: requireTimingValue(
        skill,
        "rest.afterExercise",
        rest.afterExercise,
        defaults?.rest?.afterExercise,
      ),
      afterBlock: rest.afterBlock,
    },
    setDuration: block.setDuration,
    values: block.values,
  };
};
