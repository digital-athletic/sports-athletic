import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { DirectionEntry } from "@/schemas/generator.schema";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import { pipe, type Step, when } from "@/utils/functional";
import { getTagValues } from "@/utils/tagUtils";

/** A branch that passed the rule chain, with the exercise it resolves to. */
export interface SlotCandidate {
  readonly branchId: string;
  readonly branch: SkillBranchType;
  readonly exercise: ExerciseType;
}

export type Involvement = "COMPLEX" | "ISOLATED";
export type WeightType = "WEIGHTED" | "BODYWEIGHT";

/** What one exercise slot prefers, drawn and derived before its filters run. */
export interface SlotPreferences {
  /** The movement directions of the priority sequence no earlier slot used. */
  readonly directions: readonly DirectionEntry[];
  /** The big muscles of the region no earlier slot of the tag entry trained. */
  readonly untrainedBigMuscles: readonly string[];
  readonly isLastSlot: boolean;
  readonly involvement: Involvement;
  readonly prefersBarbell: boolean;
  /** Null when the weighted/bodyweight share does not apply. */
  readonly weightType: WeightType | null;
}

export interface SlotFilterResult {
  readonly survivors: readonly SlotCandidate[];
  /** The index of the direction that matched, or null when none did. */
  readonly directionIndex: number | null;
  /** The type the survivors have, or null when the share does not apply. */
  readonly weightType: WeightType | null;
}

type CandidateCheck = (candidate: SlotCandidate) => boolean;

// Keeps the candidates the check accepts, or all of them when none passes.
const narrow = (
  candidates: readonly SlotCandidate[],
  isKept: CandidateCheck,
): readonly SlotCandidate[] => {
  const kept = candidates.filter(isKept);
  return kept.length > 0 ? kept : candidates;
};

const readBranchTags = ({ branch }: SlotCandidate, group: TagGroups) =>
  getTagValues(branch.tags, group);

export const isOneSided = ({ exercise }: SlotCandidate): boolean =>
  getTagValues(exercise.tags, TagGroups.SIDE).includes("ONE");

export const isWeighted = (candidate: SlotCandidate): boolean =>
  hasWeights(readBranchTags(candidate, TagGroups.EQUIPMENT));

const matchesDirection =
  ({ direction, side }: DirectionEntry): CandidateCheck =>
  (candidate) =>
    (direction === null ||
      readBranchTags(candidate, TagGroups.EXERCISE_DIRECTION).includes(
        direction,
      )) &&
    readBranchTags(candidate, TagGroups.SIDE).includes(side);

type SlotStep = Step<SlotFilterResult>;

const keepWhereAny =
  (isKept: CandidateCheck): SlotStep =>
  (result) => ({ ...result, survivors: narrow(result.survivors, isKept) });

// Walks the priority sequence and takes the first direction any candidate has.
const keepFirstDirection =
  (directions: readonly DirectionEntry[]): SlotStep =>
  (result) => {
    for (const [index, entry] of directions.entries()) {
      const kept = result.survivors.filter(matchesDirection(entry));
      if (kept.length > 0) {
        return { ...result, survivors: kept, directionIndex: index };
      }
    }
    return result;
  };

const keepTwoSided = keepWhereAny((candidate) => !isOneSided(candidate));

const keepUntrainedBigMuscles = (muscles: readonly string[]): SlotStep =>
  keepWhereAny((candidate) =>
    readBranchTags(candidate, TagGroups.MUSCLE).some((muscle) =>
      muscles.includes(muscle),
    ),
  );

// A branch without an involvement tag fits both draws.
const keepInvolvement = (involvement: Involvement): SlotStep =>
  keepWhereAny((candidate) => {
    const tags = readBranchTags(candidate, TagGroups.MUSCLE_INVOLVEMENT);
    return tags.length === 0 || tags.includes(involvement);
  });

const keepBarbell = keepWhereAny((candidate) =>
  readBranchTags(candidate, TagGroups.EQUIPMENT).includes(
    WorkoutConstants.EQUIPMENT.BARBELL,
  ),
);

// The drawn type first, then the other type, then every candidate.
const keepWeightType =
  (weightType: WeightType | null): SlotStep =>
  (result) => {
    if (weightType === null) return result;
    const otherType: WeightType =
      weightType === "WEIGHTED" ? "BODYWEIGHT" : "WEIGHTED";
    for (const type of [weightType, otherType]) {
      const kept = result.survivors.filter(
        (candidate) => isWeighted(candidate) === (type === "WEIGHTED"),
      );
      if (kept.length > 0) {
        return { ...result, survivors: kept, weightType: type };
      }
    }
    return result;
  };

/**
 * Applies the cascading filters of spec section 5, rule 4 to the candidates
 * of one exercise slot, in this order: movement direction, side, muscle,
 * involvement, equipment, weighted/bodyweight share. Each filter falls back
 * to the candidates before it when it would keep none.
 *
 * filterSlotCandidates([<a VERTICAL_PULL>, <b HORIZONTAL_PUSH>],
 *   { directions: [{ direction: "HORIZONTAL_PUSH", side: "BOTH" }], ... })
 * → { survivors: [<b>], directionIndex: 0, weightType: null }
 */
export const filterSlotCandidates = (
  candidates: readonly SlotCandidate[],
  preferences: SlotPreferences,
): SlotFilterResult =>
  pipe(
    {
      survivors: candidates,
      directionIndex: null,
      weightType: preferences.weightType,
    },
    keepFirstDirection(preferences.directions),
    when(preferences.isLastSlot, keepTwoSided),
    keepUntrainedBigMuscles(preferences.untrainedBigMuscles),
    // The old generator skips this draw for the core region:
    // generators/PlanGenerator.ts#L1734-L1752
    keepInvolvement(preferences.involvement),
    when(preferences.prefersBarbell, keepBarbell),
    keepWeightType(preferences.weightType),
  );
