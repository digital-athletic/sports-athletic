import type { StoredDaySkills } from "./blockHandlers/branches/storedBranchLookup";
import type { BranchesBlock } from "./stages/blockWalk";

/** The part of a stored training day the generator reads. */
export interface StoredTrainingDay {
  readonly skills: StoredDaySkills;
  /** Minutes per skill. */
  readonly lengths: Readonly<Record<string, number | undefined>>;
}

/**
 * The internal form that runs a stored training day. Stored data may break the
 * workout language rules, so this form lacks the document header and never
 * passes as a workout document for import or export.
 */
export interface StoredDayWorkout {
  readonly id: "TRAINING_DAY";
  readonly blocks: BranchesBlock[];
}

const SECONDS_PER_MINUTE = 60;

// Unrounded, as in the old generator. The set list builders divide by 60 and
// multiply again, which keeps every stored value of two decimals up to 180
// minutes exact.
const readBlockDuration = (
  { lengths }: StoredTrainingDay,
  skill: string,
): Pick<BranchesBlock, "duration"> => {
  const minutes = Object.hasOwn(lengths, skill) ? lengths[skill] : undefined;
  return minutes !== undefined && minutes > 0
    ? { duration: minutes * SECONDS_PER_MINUTE }
    : {};
};

/**
 * Writes a stored training day as a stored day workout: one branches block per
 * stored skill in stored order, holding the branch IDs of its entries with
 * repeats and the skill's minutes as seconds. An entry without a branch ID
 * drops out. A skill without branches keeps a block with an empty branch list,
 * since it still names the error of an empty day, and a day without skills
 * holds no block. Sets, superset, rests, set duration and values stay unset,
 * so the skill catalog and the plan workout timing supply them.
 *
 * createStoredDayWorkout({ skills: { WU: [{ branchId: "431", ... }] }, lengths: { WU: 5 } })
 * → { id: "TRAINING_DAY",
 *     blocks: [{ kind: "branches", skill: "WU", branches: ["431"], duration: 300 }] }
 */
export const createStoredDayWorkout = (
  training: StoredTrainingDay,
): StoredDayWorkout => ({
  id: "TRAINING_DAY",
  blocks: Object.entries(training.skills).map(([skill, entries]) => ({
    kind: "branches",
    skill,
    branches: (entries ?? []).flatMap(({ branchId }) =>
      branchId ? [branchId] : [],
    ),
    ...readBlockDuration(training, skill),
  })),
});
