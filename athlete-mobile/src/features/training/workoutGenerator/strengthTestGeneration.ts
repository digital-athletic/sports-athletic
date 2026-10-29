import { loadOneRepMaxShares } from "@/data/loadOneRepMaxShares";
import { loadStrengthTest } from "@/data/loadStrengthTest";
import { loadStrengthTestTemplate } from "@/data/loadStrengthTestTemplate";
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
import {
  createExercisesBlockHandler,
  type ExercisesBlockRules,
} from "./blockHandlers/exercises/exercisesHandler";
import { createStrengthTestWarmUpHandler } from "./blockHandlers/picks/strengthTestWarmUpHandler";
import type { GenerationInput } from "./generationInput/generationInput";
import {
  createStrengthTestSetListBuilder,
  type StrengthTestLoadData,
} from "./setListBuilders/strengthTestSetListBuilder";
import type {
  BlockHandlerRegistry,
  InterpretedWorkout,
} from "./stages/blockWalk";
import {
  createSetListBuilder,
  STRENGTH_TEST_SET_LIST_RULES,
} from "./stages/setListBuilding";
import type { WorkoutFinishRules } from "./stages/workoutFinish";
import { setUpWorkout } from "./stages/workoutSetup";
import { checkStrengthTestTemplate } from "./strengthTestTemplateCheck";
import { interpretTemplate } from "./templateInterpreter";

// A test without its warm-up is incomplete, so every block must fill.
const STRENGTH_TEST_FINISH_RULES: WorkoutFinishRules = {
  blockOrder: "template",
  emptyWorkout: "throwFirstReason",
  requiredBlocks: "every",
  sameSkillBlocks: "keepAll",
};

// The athlete picks no place for the test; it runs on the fixed STUDIO equipment.
const STRENGTH_TEST_EXERCISES_RULES: ExercisesBlockRules = {
  equipment: "ignored",
};

const throwUnreachableStrengthTestBlock = (): never => {
  throw new Error("A strength test runs picks and exercises blocks only");
};

const UNREACHABLE_STRENGTH_TEST_HANDLER = {
  usedBranchScope: "workout",
  handleBlock: throwUnreachableStrengthTestBlock,
} as const;

const createStrengthTestHandlers = (
  skillTrees: Readonly<Record<string, SkillTreeType>>,
): BlockHandlerRegistry => ({
  picks: createStrengthTestWarmUpHandler(skillTrees),
  branches: UNREACHABLE_STRENGTH_TEST_HANDLER,
  duration: UNREACHABLE_STRENGTH_TEST_HANDLER,
  exercises: createExercisesBlockHandler(STRENGTH_TEST_EXERCISES_RULES),
});

// The source checks run before any block. The old path checks workout data
// and soreness only; the age check follows the spec, where the app hid the
// test from athletes under 16 in the menu alone.
const requireStrengthTestAthlete = (athlete: UserType): void => {
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

/** The bundled test set loads and 1RM shares of the strength test. */
export const loadStrengthTestLoadData = (): StrengthTestLoadData => ({
  testSetLoads: loadStrengthTest().testSetLoads,
  oneRepMaxShares: loadOneRepMaxShares(),
});

/**
 * Generates the strength test template through the template interpreter: its
 * warm-up picks block, then its exercises block of lifts. Athletes under 16
 * and athletes with muscle soreness get no test. Every lift must be in the
 * catalog; the place's equipment does not block a lift. The set list ends on
 * the last test set.
 *
 * generateStrengthTest(input, getAllSkillTrees())
 * → [WU 432 1/1, pause 10, ..., pause 30, 25 1/4, pause 60, ..., 54 4/4]
 */
export const generateStrengthTest = (
  input: GenerationInput,
  skillTrees: Readonly<Record<string, SkillTreeType>>,
  loadData: StrengthTestLoadData = loadStrengthTestLoadData(),
  template: InterpretedWorkout = loadStrengthTestTemplate(),
): GeneratedSetListEntry[] => {
  // A broken template is a data error, so it fails before any athlete check.
  const lifts = checkStrengthTestTemplate(template, loadData);
  requireStrengthTestAthlete(input.athlete);
  return interpretTemplate(template, input, {
    handlers: createStrengthTestHandlers(skillTrees),
    finishRules: STRENGTH_TEST_FINISH_RULES,
    createSetListBuilder: (workoutInput) =>
      createSetListBuilder(workoutInput, STRENGTH_TEST_SET_LIST_RULES, {
        [lifts.skill]: createStrengthTestSetListBuilder(loadData),
      }),
    // The short workout pool rules do not apply to the strength test warm-up.
    setUpWorkout: (generationInput) => setUpWorkout(generationInput),
  }).setList;
};
