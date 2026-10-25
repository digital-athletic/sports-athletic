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

/**
 * Builds the check for a block value: the block's own value, else the
 * default, else an error naming the field. The path prefixes the field.
 *
 * createBlockDefaultCheck("GKS", "GKS.blocks[0]")("sets", undefined, undefined)
 * → throws "GKS.blocks[0].sets: skill GKS sets no default"
 */
export const createBlockDefaultCheck =
  (skill: string, path?: string) =>
  <T>(field: string, own: T | undefined, fallback: T | undefined): T => {
    const value = own ?? fallback;
    if (value === undefined) {
      const fieldPath = path === undefined ? field : `${path}.${field}`;
      throw new Error(`${fieldPath}: skill ${skill} sets no default`);
    }
    return value;
  };

/**
 * Resolves the timing of a block: each value of the block itself, else the
 * default. afterBlock comes from the block only, because the standard builder
 * reads the skill catalog's afterBlock itself. The rests resolve before sets
 * and superset, so a block missing several values names the first rest.
 *
 * resolveBlockTiming({ skill: "GKS", rest: { betweenSets: 15 }, ... }, readTrainingDayTimingDefaults("GKS", skillCatalog))
 * → { sets: 2, superset: "none",
 *     rest: { withinSuperset: 45, betweenSets: 15, afterExercise: 60, afterBlock: undefined },
 *     setDuration: undefined, values: undefined }
 */
export const resolveBlockTiming = (
  block: Block,
  defaults: SkillTimingDefaults | undefined,
  path?: string,
): ResolvedBlockTiming => {
  const requireValue = createBlockDefaultCheck(block.skill, path);
  const rest = block.rest ?? {};
  const resolvedRest = {
    withinSuperset: requireValue(
      "rest.withinSuperset",
      rest.withinSuperset,
      defaults?.rest?.withinSuperset,
    ),
    betweenSets: requireValue(
      "rest.betweenSets",
      rest.betweenSets,
      defaults?.rest?.betweenSets,
    ),
    afterExercise: requireValue(
      "rest.afterExercise",
      rest.afterExercise,
      defaults?.rest?.afterExercise,
    ),
    afterBlock: rest.afterBlock,
  };
  return {
    sets: requireValue("sets", block.sets, defaults?.sets),
    superset: requireValue("superset", block.superset, defaults?.superset),
    rest: resolvedRest,
    setDuration: block.setDuration,
    values: block.values,
  };
};
