import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type {
  BranchExerciseReference,
  ExercisePair,
} from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { readSkillSetListKind } from "@/schemas/aiwl.schema";
import type { GenerationInput } from "../generationInput/generationInput";
import { findCatalogExercise, pairOtherSideExercise } from "./exercisePairing";
import type { SetListBlock } from "./setListBuilder";
import { SKILL_SET_LIST_BUILDERS } from "./skillSetListBuilders";

interface BranchSetListRequest {
  exercise: BranchExerciseReference;
  partner?: BranchExerciseReference;
  block: SetListBlock;
  input: GenerationInput;
}

const formBranchPair = ({
  exercise,
  partner,
  input,
}: BranchSetListRequest): ExercisePair => {
  const catalogExercise = findCatalogExercise(
    input.exerciseCatalog,
    exercise.exerciseId,
  );
  const otherSidePair = pairOtherSideExercise(exercise, catalogExercise);
  if (otherSidePair) return otherSidePair;
  return partner ? { first: exercise, second: partner } : { first: exercise };
};

/**
 * Builds the set list entries of one branch with the skill's set list builder.
 * A one sided exercise pairs with its other side, else with the partner, else
 * stays alone. Returns only the branch's entries, without pauses.
 */
export const buildBranchSetList = (
  request: BranchSetListRequest,
): GeneratedSetListEntry[] => {
  const { exercise, block, input } = request;
  const builder = SKILL_SET_LIST_BUILDERS[readSkillSetListKind(block.skill)];
  const setList = builder([formBranchPair(request)], block, input);
  return setList.filter(
    ({ branchId }) =>
      branchId === exercise.branchId && !isPlaceholderBranch(branchId),
  );
};
