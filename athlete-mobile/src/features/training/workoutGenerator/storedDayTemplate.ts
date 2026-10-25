import type { Block, Template } from "@/schemas/aiwl.schema";
import type { StoredDaySkills } from "./storedBranchLookup";

/** The part of a stored training day the generator reads. */
export interface StoredTrainingDay {
  readonly skills: StoredDaySkills;
  /** Minutes per skill. */
  readonly lengths: Readonly<Record<string, number | undefined>>;
}

const SECONDS_PER_MINUTE = 60;

// Stored minutes may be fractional, so the product stays unrounded. The set
// list builders divide it by 60 and multiply by 60 again, which returns the
// same seconds for every stored value of two decimals up to 180 minutes.
const readBlockDuration = (
  { lengths }: StoredTrainingDay,
  skill: string,
): Pick<Extract<Block, { kind: "branches" }>, "duration"> => {
  const minutes = Object.hasOwn(lengths, skill) ? lengths[skill] : undefined;
  return minutes !== undefined && minutes > 0
    ? { duration: minutes * SECONDS_PER_MINUTE }
    : {};
};

/**
 * Writes a stored training day as a template: one branches block per stored
 * skill in stored order, holding the branch IDs of its entries with repeats
 * and the skill's minutes as seconds. An entry without a branch ID drops out.
 * A skill without branches keeps an empty block, since it still names the
 * error of an empty day. Sets, superset, rests, set duration and values stay
 * unset, so the skill catalog and the plan workout timing supply them.
 *
 * createStoredDayTemplate({ skills: { WU: [{ branchId: "431", ... }] }, lengths: { WU: 5 } })
 * → { aiwl: 1, id: "TRAINING_DAY", name: { en: "Training day" },
 *     blocks: [{ kind: "branches", skill: "WU", branches: ["431"], duration: 300 }] }
 */
export const createStoredDayTemplate = (
  training: StoredTrainingDay,
): Template => ({
  aiwl: 1,
  id: "TRAINING_DAY",
  name: { en: "Training day" },
  blocks: Object.entries(training.skills).map(([skill, entries]) => ({
    kind: "branches",
    skill,
    branches: (entries ?? []).flatMap(({ branchId }) =>
      branchId ? [branchId] : [],
    ),
    ...readBlockDuration(training, skill),
  })),
});
