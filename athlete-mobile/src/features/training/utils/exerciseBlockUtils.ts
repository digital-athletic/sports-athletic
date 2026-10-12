import { TagGroups } from "@/constants/tagGroups";
import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import { getTagValues } from "@/utils/tagUtils";

const blockTagValues = (block: ExercisePair, tagGroup: string): string[] =>
  [block.first, block.second].flatMap((entry) =>
    entry ? getTagValues(entry.branchTags, tagGroup) : [],
  );

const sharesAny = (a: string[], b: string[]): boolean =>
  a.some((value) => b.includes(value));

/**
 * True when the next block trains the same body region and the same primary
 * muscles, so the finished block closes on the single-exercise rest.
 */
export const trainsSameRegionAndPrimaryMuscle = (
  finished: ExercisePair,
  next: ExercisePair,
): boolean =>
  sharesAny(
    blockTagValues(finished, TagGroups.REGION),
    blockTagValues(next, TagGroups.REGION),
  ) &&
  sharesAny(
    blockTagValues(finished, TagGroups.MUSCLE),
    blockTagValues(next, TagGroups.MUSCLE),
  );
