import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { StoredBranch } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import { resolveStoredBranchExercise } from "@/features/training/workoutGenerator/blockHandlers/library/branchResolution";
import { buildBranchSetList } from "@/features/training/workoutGenerator/setListBuilders/branchSetList";
import { findCatalogExercise } from "@/features/training/workoutGenerator/setListBuilders/exercisePairing";
import type { SetListBlock } from "@/features/training/workoutGenerator/setListBuilders/setListBuilder";
import type { WorkoutInput } from "@/features/training/workoutGenerator/stages/workoutSetup";
import { toUserExerciseData } from "@/schemas/generator.schema";

/** The input for building the entries of an alternative. */
interface AlternativeBuildRequest {
  session: readonly UserExerciseDataType[];
  input: WorkoutInput;
  block: SetListBlock;
  target: string;
  alternative: StoredBranch;
}

interface EntryRange {
  first: number;
  last: number;
}

interface UsedEntries {
  usedBranchIds: string[];
  usedExerciseIds: string[];
}

/** Lists each non-placeholder branch of the session once, in session order. */
export const listDistinctSessionBranchIds = (
  session: readonly UserExerciseDataType[],
): string[] => {
  const branchIds = session.flatMap(({ branchId }) =>
    branchId && !isPlaceholderBranch(branchId) ? [branchId] : [],
  );
  return [...new Set(branchIds)];
};

/** Lists the branches and exercises of the session outside the given branch. */
export const listUsedEntries = (
  session: readonly UserExerciseDataType[],
  branchId: string,
): UsedEntries => {
  const others = session.filter((entry) => entry.branchId !== branchId);
  return {
    usedBranchIds: others.flatMap((entry) =>
      entry.branchId ? [entry.branchId] : [],
    ),
    usedExerciseIds: others.map(({ exerciseId }) => exerciseId),
  };
};

const resolveAlternative = (
  alternative: StoredBranch,
  input: WorkoutInput,
): BranchExerciseReference =>
  resolveStoredBranchExercise(
    alternative,
    input.athleteLevel,
    input.exerciseCatalog,
    input.exerciseData.branchData[alternative.branchId] ?? null,
  );

const readEntryRange = (
  session: readonly UserExerciseDataType[],
  branchId: string,
): EntryRange => ({
  first: session.findIndex((entry) => entry.branchId === branchId),
  last: session.findLastIndex((entry) => entry.branchId === branchId),
});

const overlaps = (a: EntryRange, b: EntryRange): boolean =>
  a.first <= b.last && b.first <= a.last;

/**
 * Lists the other non-placeholder branches of the skill whose entries
 * interleave with the target's.
 */
const listInterleavedBranchIds = ({
  session,
  block,
  target,
}: AlternativeBuildRequest): string[] => {
  const targetRange = readEntryRange(session, target);
  const skillEntries = session.filter((entry) => entry.skill === block.skill);
  return listDistinctSessionBranchIds(skillEntries).filter(
    (branchId) =>
      branchId !== target &&
      overlaps(readEntryRange(session, branchId), targetRange),
  );
};

/**
 * Finds the target's superset partner, the branch whose entries interleave
 * with the target's. Session entries store no tags, so the partner's tags
 * come from the exercise catalog.
 */
const findSupersetPartner = (
  request: AlternativeBuildRequest,
): BranchExerciseReference | undefined => {
  const partnerIds = listInterleavedBranchIds(request);
  if (partnerIds.length > 1) {
    throw new Error(`Exercise swap found ${partnerIds.length} partners`);
  }
  const entry = request.session.find(({ branchId }) =>
    partnerIds.includes(branchId ?? ""),
  );
  if (entry?.branchId === undefined) return undefined;
  const exercise = findCatalogExercise(
    request.input.exerciseCatalog,
    entry.exerciseId,
  );
  return {
    branchId: entry.branchId,
    branchTags: exercise?.tags ?? [],
    exerciseId: entry.exerciseId,
  };
};

/**
 * Builds the entries of the alternative with the block timing and the
 * target's superset partner. Throws when the skill's set list builder misses
 * a timing value or workout data.
 */
export const buildAlternativeEntries = (
  request: AlternativeBuildRequest,
): UserExerciseDataType[] => {
  const { input, block, alternative } = request;
  const entries = buildBranchSetList({
    exercise: resolveAlternative(alternative, input),
    partner: findSupersetPartner(request),
    block,
    input,
  });
  return entries.map(toUserExerciseData);
};

/**
 * Replaces the session entries of a branch, in place and in order, with the
 * given entries. Set positions are unchanged. Returns null when no entries are
 * given, the entry counts differ, or a written exercise trains under another branch.
 */
export const replaceSessionBranch = (
  session: readonly UserExerciseDataType[],
  branchId: string,
  entries: readonly UserExerciseDataType[],
): UserExerciseDataType[] | null => {
  const oldCount = session.filter(
    (entry) => entry.branchId === branchId,
  ).length;
  if (entries.length === 0 || entries.length !== oldCount) return null;
  const { usedExerciseIds } = listUsedEntries(session, branchId);
  if (entries.some((entry) => usedExerciseIds.includes(entry.exerciseId))) {
    return null;
  }
  let next = 0;
  return session.map((entry) =>
    entry.branchId === branchId
      ? { ...entries[next++], set: entry.set }
      : entry,
  );
};
