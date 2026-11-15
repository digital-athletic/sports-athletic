import {
  type BranchSelectingBlock,
  readSkillSetListKind,
  type Superset,
} from "@/schemas/aiwl.schema";
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

// A cardio block draws one branch and pairs nothing, so it needs no superset.
const resolveSuperset = (
  block: BranchSelectingBlock,
  defaults: SkillTimingDefaults | undefined,
  requireValue: ReturnType<typeof createBlockDefaultCheck>,
): Superset =>
  readSkillSetListKind(block.skill) === "cardio"
    ? (block.superset ?? defaults?.superset ?? "none")
    : requireValue("superset", block.superset, defaults?.superset);

// afterBlock may stay undefined: the builder then closes on afterExercise.
const resolveBlockRest = (
  rest: NonNullable<BranchSelectingBlock["rest"]>,
  defaultRest: SkillTimingDefaults["rest"] | undefined,
  requireValue: ReturnType<typeof createBlockDefaultCheck>,
): ResolvedBlockTiming["rest"] => ({
  withinSuperset: requireValue(
    "rest.withinSuperset",
    rest.withinSuperset,
    defaultRest?.withinSuperset,
  ),
  betweenSets: requireValue(
    "rest.betweenSets",
    rest.betweenSets,
    defaultRest?.betweenSets,
  ),
  afterExercise: requireValue(
    "rest.afterExercise",
    rest.afterExercise,
    defaultRest?.afterExercise,
  ),
  afterBlock: rest.afterBlock ?? defaultRest?.afterBlock,
});

/**
 * Resolves the timing of a block: each value of the block itself, else the
 * default. afterBlock may stay undefined; a cardio superset falls back to
 * "none". The rests resolve before sets and superset, so a block missing
 * several values names the first rest.
 *
 * resolveBlockTiming({ skill: "WUSPEZIAL", rest: { betweenSets: 15 }, ... }, readTrainingDayTimingDefaults("WUSPEZIAL", skillCatalog))
 * → { sets: 1, superset: "muscles",
 *     rest: { withinSuperset: 10, betweenSets: 15, afterExercise: 10, afterBlock: 30 },
 *     setDuration: undefined, values: undefined }
 */
export const resolveBlockTiming = (
  block: BranchSelectingBlock,
  defaults: SkillTimingDefaults | undefined,
  path?: string,
): ResolvedBlockTiming => {
  const requireValue = createBlockDefaultCheck(block.skill, path);
  const resolvedRest = resolveBlockRest(
    block.rest ?? {},
    defaults?.rest,
    requireValue,
  );
  return {
    sets: requireValue("sets", block.sets, defaults?.sets),
    superset: resolveSuperset(block, defaults, requireValue),
    rest: resolvedRest,
    setDuration: block.setDuration,
    values: block.values,
  };
};
