import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { createBranchesBlockHandler } from "./blockHandlers/branches/branchesHandler";
import type { StoredBranchLookup } from "./blockHandlers/branches/storedBranchLookup";
import { createCardioDurationHandler } from "./blockHandlers/duration/cardioDurationHandler";
import { handlePicksBlock } from "./blockHandlers/picks/picksHandler";
import { DEFAULT_PICKS_POOL_RULES } from "./blockHandlers/picks/picksWorkoutRules";
import type { GenerationInput } from "./generationInput/generationInput";
import type {
  BlockHandlerRegistry,
  InterpretedWorkout,
} from "./stages/blockWalk";
import { createSetListBuilder } from "./stages/setListBuilding";
import { requireSupportedTemplateBlocks } from "./stages/templateBlockCheck";
import { interpretTemplate } from "./templateInterpreter";

/** A workout and the lookup that reads the branch data of its branch IDs. */
export interface SelectedWorkout {
  workout: InterpretedWorkout;
  lookUpBranch: StoredBranchLookup;
}

export interface WorkoutGenerationOptions {
  skillTrees?: Readonly<Record<string, SkillTreeType>>;
}

const throwUnreachableExercisesBlock = (): never => {
  throw new Error("The block kind check rejects every exercises block");
};

// The registry reads the picks handler per run, so a spy on it takes effect.
const createHandlerRegistry = (
  lookUpBranch: StoredBranchLookup,
): BlockHandlerRegistry => {
  const branches = createBranchesBlockHandler(lookUpBranch);
  return {
    picks: handlePicksBlock,
    branches,
    duration: createCardioDurationHandler(branches),
    exercises: throwUnreachableExercisesBlock,
  };
};

/**
 * Generates the set list of a workout with one handler registry and one set
 * of finish rules. Every workout passes the block kind check first. Its
 * blocks then run in workout order, and an empty block adds nothing. A
 * workout that draws no exercise throws the error of its first empty block.
 *
 * generateSetList(mobilityTemplate, lookUpStoredBranchInCatalog, input, { skillTrees })
 * → [{ branchId: "2", exerciseId: "21", skill: "MOB", ... }, ...]
 */
export const generateSetList = (
  workout: InterpretedWorkout,
  lookUpBranch: StoredBranchLookup,
  input: GenerationInput,
  options: WorkoutGenerationOptions = {},
): GeneratedSetListEntry[] => {
  requireSupportedTemplateBlocks(workout);
  return interpretTemplate(workout, input, {
    handlers: createHandlerRegistry(lookUpBranch),
    finishRules: { requiredBlocks: "none" },
    createSetListBuilder,
    skillTrees: options.skillTrees,
    picksPoolRules: DEFAULT_PICKS_POOL_RULES,
  }).setList;
};
