import type {
  BranchSelectingBlock,
  SkillSetListKind,
} from "@/schemas/aiwl.schema";
import { Logger } from "@/services/Logger";
import { STEADY_ZONES } from "../setListBuilders/cardioSetListBuilder";

/** A block setting the set list builder of a skill may leave unread. */
type IgnorableBlockSetting = keyof Pick<
  BranchSelectingBlock,
  | "order"
  | "countBy"
  | "fallbackToWholeTree"
  | "superset"
  | "sets"
  | "setDuration"
  | "values"
  | "rest"
>;

// The generator orders exercises by its own rule, so no block reads order.
const IGNORED_ON_EVERY_BLOCK: readonly IgnorableBlockSetting[] = ["order"];

// Only a picks block draws by count and falls back to the whole skill tree.
const IGNORED_OUTSIDE_PICKS: readonly IgnorableBlockSetting[] = [
  "countBy",
  "fallbackToWholeTree",
];

const IGNORED_BY_KIND: Record<
  SkillSetListKind,
  readonly IgnorableBlockSetting[]
> = {
  standard: [],
  maxStrength: ["superset", "sets", "setDuration", "values", "rest"],
  cardio: ["superset", "sets", "setDuration", "values", "rest"],
};

// The interval zones time their sets by these two; the steady zones do not.
const READ_BY_INTERVAL_ZONES: readonly IgnorableBlockSetting[] = [
  "setDuration",
  "values",
];

// A max strength block pairs by "none" anyway, so stating it changes nothing.
const isIgnoredValue = (
  block: BranchSelectingBlock,
  kind: SkillSetListKind,
  setting: IgnorableBlockSetting,
): boolean => {
  if (block[setting] === undefined) return false;
  if (kind === "maxStrength" && setting === "superset") {
    return block.superset !== "none";
  }
  if (kind === "cardio" && !STEADY_ZONES.has(block.skill)) {
    return !READ_BY_INTERVAL_ZONES.includes(setting);
  }
  return true;
};

/**
 * Lists the settings a block sets that the generator does not read for the
 * set list builder of its skill, in a fixed order. Duration and bodyParts
 * never appear: a training day stores a duration on every branches block, and
 * the template check rejects bodyParts.
 *
 * listIgnoredBlockSettings({ kind: "picks", skill: "MAX", sets: 4, order: "asDrawn", ... }, "maxStrength")
 * → ["order", "sets"]
 */
export const listIgnoredBlockSettings = (
  block: BranchSelectingBlock,
  kind: SkillSetListKind,
): string[] => {
  const candidates = [
    ...IGNORED_ON_EVERY_BLOCK,
    ...(block.kind === "picks" ? [] : IGNORED_OUTSIDE_PICKS),
    ...IGNORED_BY_KIND[kind],
  ];
  return candidates.filter((setting) => isIgnoredValue(block, kind, setting));
};

/**
 * Logs one warning naming the skill and the settings the generator ignores
 * for it; an empty list logs nothing.
 *
 * warnIgnoredBlockSettings("MAX", ["order", "sets"])
 * → logs "MAX: the generator ignores order, sets"
 */
export const warnIgnoredBlockSettings = (
  skill: string,
  settings: readonly string[],
): void => {
  if (settings.length === 0) return;
  Logger.logWarning(`${skill}: the generator ignores ${settings.join(", ")}`);
};
