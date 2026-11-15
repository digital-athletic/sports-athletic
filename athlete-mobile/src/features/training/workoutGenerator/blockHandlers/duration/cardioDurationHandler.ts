import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type {
  BlockHandlerRegistry,
  BranchesBlock,
} from "../../stages/blockWalk";
import type { WorkoutInput } from "../../stages/workoutSetup";
import { applyBranchesRuleChain } from "../branches/branchesRuleChain";
import {
  listStoredBranches,
  lookUpStoredBranchInCatalog,
} from "../branches/storedBranchLookup";

type BranchesBlockHandler = BlockHandlerRegistry["branches"];
type DurationBlockHandler = BlockHandlerRegistry["duration"];

const listTreeBranchIds = (skill: string, input: WorkoutInput): string[] =>
  [...input.branchLookupIndex.values()]
    .filter(
      ({ skillTreeName, branch }) =>
        skillTreeName === skill && Object.keys(branch.levels).length > 0,
    )
    .map(({ branchId }) => branchId);

/**
 * Runs a cardio duration block as the one-branch branches block plan creation
 * stores: it draws one branch of the skill's tree that the athlete's pains,
 * age group, gender, soreness, equipment and level allow, without the
 * families the workout filters switch off, then hands it to the branches
 * handler. Without an allowed branch it hands on a blocked one, which the
 * handler treats as a blocked stored branch of a training day: lower body
 * soreness, for example, swaps the block for the CARDIO_5 run.
 *
 * handleCardioDurationBlock({ kind: "duration", skill: "CARDIO_2", duration: 1200 }, input, ...)
 * → the branches result of { kind: "branches", skill: "CARDIO_2", duration: 1200, branches: ["582"] }
 */
export const createCardioDurationHandler =
  (branchesHandler: BranchesBlockHandler): DurationBlockHandler =>
  (block, input, usedBranches, walk) => {
    const treeBranchIds = listTreeBranchIds(block.skill, input);
    if (treeBranchIds.length === 0) {
      throw {
        type: "NO_EXERCISES",
        subtype: "SKILL_TREE",
        params: [block.skill],
      } satisfies GeneratorError;
    }
    const treeBlock: BranchesBlock = {
      ...block,
      kind: "branches",
      branches: treeBranchIds,
    };
    const { keep } = applyBranchesRuleChain(
      listStoredBranches(treeBlock, input, lookUpStoredBranchInCatalog),
      input,
      block.skill,
      input.filters,
    );
    const allowed = Object.keys(keep);
    const candidates = allowed.length > 0 ? allowed : treeBranchIds;
    const drawnBlock: BranchesBlock = {
      ...treeBlock,
      branches: [candidates[Math.floor(input.random() * candidates.length)]],
    };
    return branchesHandler(drawnBlock, input, usedBranches, walk);
  };
