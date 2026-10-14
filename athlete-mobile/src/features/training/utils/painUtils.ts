import { type MuscleType } from "@/bodyParts/types";
import { TagGroups } from "@/constants/tagGroups";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues, getUserTagValues } from "@/utils/tagUtils";
import { type TagsByGroup } from "../models/Tags";
import { type TrainingType } from "../models/Training";
import { type UserExerciseDataType } from "../models/UserExerciseData";

/**
 * Pain regions the anamnesis can store and the generator understands. The
 * order is top to bottom, left before right, and doubles as the chip order.
 * Pinned to MuscleType so every region keeps its `muscles.*` translation.
 */
export const PAIN_REGIONS = [
  "SHOULDER_LEFT",
  "SHOULDER_RIGHT",
  "ELBOW_LEFT",
  "ELBOW_RIGHT",
  "WRIST_LEFT",
  "WRIST_RIGHT",
  "SPINE",
  "HIP_LEFT",
  "HIP_RIGHT",
  "KNEE_LEFT",
  "KNEE_RIGHT",
  "ANKLE_LEFT",
  "ANKLE_RIGHT",
] as const satisfies readonly MuscleType[];

export type PainRegion = (typeof PAIN_REGIONS)[number];

// Prevention exercise types
const PREVENTION = {
  SHOULDER: "PREVSHOULDER",
  WRIST: "PREVWRIST",
  SPINE: "PREVSPINE",
  KNEE: "PREVKNEE",
  ANKLE: "PREVANKLE",
} as const;

// Body part blocks
const BODY_BLOCKS = {
  SHOULDER: "SHOULDER",
  ELBOW: "ELBOW",
  WRIST: "WRIST",
  SPINE: "SPINE",
  HIP: "HIP",
  KNEE: "KNEE",
  ANKLE: "ANKLE",
} as const;

type PreventionSkill = (typeof PREVENTION)[keyof typeof PREVENTION];
type BodyBlock = (typeof BODY_BLOCKS)[keyof typeof BODY_BLOCKS];

// Hip and knee share one prevention program on purpose (product decision).
const PREVENTION_BY_REGION: Record<PainRegion, PreventionSkill> = {
  SHOULDER_LEFT: PREVENTION.SHOULDER,
  SHOULDER_RIGHT: PREVENTION.SHOULDER,
  ELBOW_LEFT: PREVENTION.WRIST,
  ELBOW_RIGHT: PREVENTION.WRIST,
  WRIST_LEFT: PREVENTION.WRIST,
  WRIST_RIGHT: PREVENTION.WRIST,
  SPINE: PREVENTION.SPINE,
  HIP_LEFT: PREVENTION.KNEE,
  HIP_RIGHT: PREVENTION.KNEE,
  KNEE_LEFT: PREVENTION.KNEE,
  KNEE_RIGHT: PREVENTION.KNEE,
  ANKLE_LEFT: PREVENTION.ANKLE,
  ANKLE_RIGHT: PREVENTION.ANKLE,
};

const BLOCK_BY_REGION: Record<PainRegion, BodyBlock> = {
  SHOULDER_LEFT: BODY_BLOCKS.SHOULDER,
  SHOULDER_RIGHT: BODY_BLOCKS.SHOULDER,
  ELBOW_LEFT: BODY_BLOCKS.ELBOW,
  ELBOW_RIGHT: BODY_BLOCKS.ELBOW,
  WRIST_LEFT: BODY_BLOCKS.WRIST,
  WRIST_RIGHT: BODY_BLOCKS.WRIST,
  SPINE: BODY_BLOCKS.SPINE,
  HIP_LEFT: BODY_BLOCKS.HIP,
  HIP_RIGHT: BODY_BLOCKS.HIP,
  KNEE_LEFT: BODY_BLOCKS.KNEE,
  KNEE_RIGHT: BODY_BLOCKS.KNEE,
  ANKLE_LEFT: BODY_BLOCKS.ANKLE,
  ANKLE_RIGHT: BODY_BLOCKS.ANKLE,
};

export function isPainRegion(value: string): value is PainRegion {
  return (PAIN_REGIONS as readonly string[]).includes(value);
}

/**
 * Maps stored pain values through a region table, dropping unknown values
 * instead of guessing a region for them and de-duplicating the result.
 */
function mapKnownPains<T extends string>(
  pains: string[],
  table: Record<PainRegion, T>,
): T[] {
  const result: T[] = [];
  for (const pain of pains) {
    if (!isPainRegion(pain)) continue;
    const mapped = table[pain];
    if (!result.includes(mapped)) result.push(mapped);
  }
  return result;
}

/**
 * Maps pain locations to prevention exercise types
 */
export function getPreventionsFromPains(pains: string[]): string[] {
  return mapKnownPains(pains, PREVENTION_BY_REGION);
}

/**
 * Maps pain locations to blocked body regions
 */
export function getBlocksFromPains(pains: string[]): string[] {
  return mapKnownPains(pains, BLOCK_BY_REGION);
}

/**
 * Whether the branch or the exercise on any of its levels blocks one of the
 * regions. Every level counts, because a level change must never reach a
 * blocked exercise.
 */
export function isBranchBlocked(
  branchTags: string[],
  levelExerciseIds: string[],
  exercises: Pick<ExerciseType, "id" | "tags">[],
  blockedRegions: string[],
): boolean {
  if (blockedRegions.length === 0) return false;
  const tagLists = [
    branchTags,
    ...levelExerciseIds.map(
      (exerciseId) =>
        exercises.find((exercise) => exercise.id === exerciseId)?.tags ?? [],
    ),
  ];
  return tagLists.some((tags) =>
    getTagValues(tags, TagGroups.BLOCK).some((region) =>
      blockedRegions.includes(region),
    ),
  );
}

/**
 * Whether the pain warning belongs in front of this training. Its text refers
 * to max strength exercises; the strength test measures those maxima, so its
 * exercises carry no weightType and it always qualifies.
 */
export function shouldShowPainAlert(
  trainingType: TrainingType,
  exerciseList: Pick<UserExerciseDataType, "weightType">[],
  tags: TagsByGroup | undefined,
): boolean {
  if (getUserTagValues(tags, TagGroups.PAIN).length === 0) return false;
  if (trainingType === "TEST_WORKOUT") return true;
  if (trainingType !== "PLAN") return false;
  return exerciseList.some((exercise) => exercise.weightType === "weightFMax");
}
