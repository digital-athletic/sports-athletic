import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import { getAreasFor } from "@/features/training/utils/exerciseUtils";
import { canTakeStrengthTest } from "@/features/training/utils/strengthTestUtils";
import {
  getTemporalTags,
  getUserBirthday,
  requireWorkoutData,
} from "@/features/training/utils/userDataUtils";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import { createBranchesBlockHandler } from "./blockHandlers/branches/branchesHandler";
import type { StoredBranchLookup } from "./blockHandlers/branches/storedBranchLookup";
import { createCardioDurationHandler } from "./blockHandlers/duration/cardioDurationHandler";
import { handleExercisesBlock } from "./blockHandlers/exercises/exercisesHandler";
import { handlePicksBlock } from "./blockHandlers/picks/picksHandler";
import type { GenerationInput } from "./generationInput/generationInput";
import type { PrescribedSetListBuilders } from "./setListBuilders/setListBuilder";
import {
  createStrengthTestSetListBuilder,
  type StrengthTestLoadData,
} from "./setListBuilders/strengthTestSetListBuilder";
import type {
  BlockHandlerRegistry,
  InterpretedWorkout,
} from "./stages/blockWalk";
import { createSetListBuilder } from "./stages/setListBuilding";
import type { FinishedWorkout } from "./stages/workoutFinish";
import { requireSupportedTemplateBlocks } from "./stages/templateBlockCheck";
import type { WorkoutInput } from "./stages/workoutSetup";
import { loadStrengthTestLoadData } from "./strengthTestLoadData";
import {
  checkStrengthTestTemplate,
  holdsTestSets,
} from "./strengthTestTemplateCheck";
import { interpretTemplate } from "./templateInterpreter";
import { resolveWorkoutFilters, type WorkoutFilters } from "./workoutFilters";

/** A workout and the lookup that reads the branch data of its branch IDs. */
export interface SelectedWorkout {
  workout: InterpretedWorkout;
  lookUpBranch: StoredBranchLookup;
}

export interface WorkoutGenerationOptions {
  skillTrees?: Readonly<Record<string, SkillTreeType>>;
  /** Test set loads and 1RM shares; loaded from the bundle when a workout holds test sets. */
  loadData?: StrengthTestLoadData;
  /** The athlete filters the workout switches off; every filter applies by default. */
  filters?: Partial<WorkoutFilters>;
}

// The spec bars athletes under 16 from the test; the menu hides it from them
// too, but the generator must not rely on that.
const requireTestSetAthlete = (athlete: UserType): void => {
  requireWorkoutData(athlete);
  if (!canTakeStrengthTest(ageGroupFor(getUserBirthday(athlete)))) {
    throw {
      type: "NO_EXERCISES",
      subtype: "AGE",
      params: [],
    } satisfies GeneratorError;
  }
  if (getAreasFor(getTemporalTags(athlete)).length > 0) {
    throw {
      type: "TOO_MUCH_SORENESS",
      subtype: "TEST_WORKOUT",
      params: [],
    } satisfies GeneratorError;
  }
};

/**
 * Runs the checks of a workout with test sets before any block runs and
 * returns the strength test builder for the skill of its lifts. A broken
 * workout is a data error, so it fails before any athlete check.
 */
const prepareTestSetWorkout = (
  workout: InterpretedWorkout,
  athlete: UserType,
  loadData: StrengthTestLoadData = loadStrengthTestLoadData(),
): PrescribedSetListBuilders => {
  const lifts = checkStrengthTestTemplate(workout, loadData);
  requireTestSetAthlete(athlete);
  return { [lifts.skill]: createStrengthTestSetListBuilder(loadData) };
};

const createHandlerRegistry = (
  lookUpBranch: StoredBranchLookup,
): BlockHandlerRegistry => {
  const branches = createBranchesBlockHandler(lookUpBranch);
  return {
    picks: handlePicksBlock,
    branches,
    duration: createCardioDurationHandler(branches),
    exercises: handleExercisesBlock,
  };
};

/**
 * Generates the set list of one workout template for the athlete of the
 * input. The core of the workout generator: it knows no training type, no
 * training place and no drawn workout. `generateSetList` in the router
 * prepares those and calls this function.
 *
 * 1. Rejects a block kind the generator does not support.
 * 2. A workout with test sets (the strength test) checks its lifts against
 *    the load data, then rejects an athlete without workout data, under 16 or
 *    with muscle soreness, before any block runs.
 * 3. Runs the blocks in template order: each block draws its branches through
 *    `lookUpBranch` and picks the exercise at the athlete's branch level, with
 *    the soreness, pain and equipment filters on unless `options.filters`
 *    switches one off.
 * 4. Builds the sets, reps, loads and rests of each drawn exercise.
 *
 * Returns the set list and the result of each block (its drawn exercises, or
 * empty). A workout with test sets throws when a block stays empty. Any other
 * workout returns the blocks that filled and leaves out the empty ones. Every
 * random draw reads `input.random`.
 *
 * generateSetListFromWorkout(mobilityTemplate, lookUpStoredBranchInCatalog, input)
 * → { setList: [{ branchId: "2", exerciseId: "21", skill: "MOB", ... }, ...], blocks: [...] }
 */
export const generateSetListFromWorkout = (
  workout: InterpretedWorkout,
  lookUpBranch: StoredBranchLookup,
  input: GenerationInput,
  options: WorkoutGenerationOptions = {},
): FinishedWorkout<GeneratedSetListEntry> => {
  requireSupportedTemplateBlocks(workout);
  const withTestSets = holdsTestSets(workout);
  const prescribedBuilders = withTestSets
    ? prepareTestSetWorkout(workout, input.athlete, options.loadData)
    : {};
  return interpretTemplate(workout, input, {
    handlers: createHandlerRegistry(lookUpBranch),
    finishRules: { requiredBlocks: withTestSets ? "every" : "none" },
    createSetListBuilder: (workoutInput: WorkoutInput) =>
      createSetListBuilder(workoutInput, prescribedBuilders),
    skillTrees: options.skillTrees,
    filters: resolveWorkoutFilters(options.filters),
  });
};
