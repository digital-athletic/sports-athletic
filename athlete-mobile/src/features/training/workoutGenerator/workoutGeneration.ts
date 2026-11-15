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
import { createExercisesBlockHandler } from "./blockHandlers/exercises/exercisesHandler";
import { handlePicksBlock } from "./blockHandlers/picks/picksHandler";
import {
  type PicksPoolRules,
  DEFAULT_PICKS_POOL_RULES,
} from "./blockHandlers/picks/picksWorkoutRules";
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
import { requireSupportedTemplateBlocks } from "./stages/templateBlockCheck";
import type { WorkoutInput } from "./stages/workoutSetup";
import { loadStrengthTestLoadData } from "./strengthTestLoadData";
import {
  checkStrengthTestTemplate,
  holdsTestSets,
} from "./strengthTestTemplateCheck";
import { interpretTemplate } from "./templateInterpreter";

/** A workout and the lookup that reads the branch data of its branch IDs. */
export interface SelectedWorkout {
  workout: InterpretedWorkout;
  lookUpBranch: StoredBranchLookup;
}

export interface WorkoutGenerationOptions {
  skillTrees?: Readonly<Record<string, SkillTreeType>>;
  /** Test set loads and 1RM shares; loaded from the bundle when a workout holds test sets. */
  loadData?: StrengthTestLoadData;
}

// A test runs on fixed studio equipment and its lifts ignore pain, so the
// warm-up does too.
const TEST_SET_PICKS_POOL_RULES: PicksPoolRules = {
  pain: "ignored",
  equipment: "ignored",
};

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
  withTestSets: boolean,
): BlockHandlerRegistry => {
  const branches = createBranchesBlockHandler(lookUpBranch);
  return {
    picks: handlePicksBlock,
    branches,
    duration: createCardioDurationHandler(branches),
    // The athlete picks no place for a test; it runs on studio equipment.
    exercises: createExercisesBlockHandler({
      equipment: withTestSets ? "ignored" : "required",
    }),
  };
};

/**
 * Generates the set list of any workout with one handler registry and one set
 * of finish rules. Every workout passes the block kind check first. A workout
 * with test sets then passes the test set checks with the load data, rejects
 * an athlete without workout data, under 16 or with muscle soreness before any
 * block runs, and throws when a block stays empty. Its lifts build with the
 * strength test builder.
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
  const withTestSets = holdsTestSets(workout);
  const prescribedBuilders = withTestSets
    ? prepareTestSetWorkout(workout, input.athlete, options.loadData)
    : {};
  return interpretTemplate(workout, input, {
    handlers: createHandlerRegistry(lookUpBranch, withTestSets),
    finishRules: { requiredBlocks: withTestSets ? "every" : "none" },
    createSetListBuilder: (workoutInput: WorkoutInput) =>
      createSetListBuilder(workoutInput, prescribedBuilders),
    skillTrees: options.skillTrees,
    picksPoolRules: withTestSets
      ? TEST_SET_PICKS_POOL_RULES
      : DEFAULT_PICKS_POOL_RULES,
  }).setList;
};
