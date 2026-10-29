import type { SetTuple } from "@/common/types/SetTuple";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import {
  PAUSE_EXERCISE_ID,
  PLACEHOLDER_BRANCH_ID,
} from "@/features/training/models/IdTypes";
import {
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "@/features/training/models/MaxValues";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { createExerciseMap } from "@/features/training/utils/exerciseAccessor";
import { requireWorkoutData } from "@/features/training/utils/userDataUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  MaxTrainingRepsEntry,
  SkillCode,
} from "@/schemas/generator.schema";
import { readExerciseFMax } from "../exerciseValues/exerciseFMax";
import type { GenerationInput } from "../generationInput/generationInput";
import {
  readMaxTrainingRepetitions,
  readMaxTrainingWeights,
} from "./maxStrengthLadder";
import type { SkillSetListBuilder } from "./setListBuilder";
import {
  buildSupportSets,
  EMPTY_SUPPORT_EXERCISE_TALLY,
  listSupportExercises,
  pickSupportExercise,
  readWeightedSupportShare,
  type SupportExerciseTally,
} from "./supportExercisePick";
import { roundWeight } from "../exerciseValues/weightRounding";

const WARM_UP_WEIGHT_PERCENTAGES = [50, 75];
const WARM_UP_REST_SECONDS = 60;
const LAST_WORKING_SET_REST_SECONDS = 120;
const BEFORE_SUPPORT_REST_SECONDS = 30;
const BETWEEN_SUPPORT_SETS_REST_SECONDS = 60;

/** The rests between two working sets, in seconds. */
interface WorkingSetRests {
  afterSupport: number;
  withoutSupport: number;
}

const PROFESSIONAL_WORKING_SET_RESTS: WorkingSetRests = {
  afterSupport: 90,
  withoutSupport: 240,
};
const DEFAULT_WORKING_SET_RESTS: WorkingSetRests = {
  afterSupport: 30,
  withoutSupport: 180,
};

interface MaxStrengthContext {
  skill: SkillCode;
  input: GenerationInput;
  maxValues: MaxValuesType;
  weightedShare: number;
  workingSetRests: WorkingSetRests;
}

interface MaxStrengthSets {
  weights: number[];
  repetitions: MaxTrainingRepsEntry[];
  warmUpCount: number;
}

interface BuiltSetList {
  setList: GeneratedSetListEntry[];
  tally: SupportExerciseTally;
}

// A corrupt percentage or a missing 1RM loads the set with 0 kg.
const readWorkingWeight = (
  weightPercentage: number,
  exercise: ExerciseType,
  maxValues: MaxValuesType,
): number => {
  const fMax = readExerciseFMax(exercise, maxValues);
  if (!Number.isFinite(weightPercentage) || fMax === undefined) return 0;
  return roundWeight((weightPercentage / 100) * fMax, exercise);
};

// Warm-up loads come from the displayed, rounded load of the first working
// set, so the warm-up sets match what the athlete sees.
const readMaxStrengthSets = (
  exercise: ExerciseType,
  { skill, input, maxValues }: MaxStrengthContext,
): MaxStrengthSets => {
  const ladder = readMaxTrainingWeights(
    exercise,
    input.athlete,
    input.exerciseData.exerciseData,
    skill,
  );
  const workingWeights = ladder.trainingWeights.map((weightPercentage) =>
    readWorkingWeight(weightPercentage, exercise, maxValues),
  );
  const warmUpWeights = WARM_UP_WEIGHT_PERCENTAGES.map((percentage) =>
    roundWeight((percentage / 100) * workingWeights[0], exercise),
  );
  return {
    weights: [...warmUpWeights, ...workingWeights],
    repetitions: readMaxTrainingRepetitions(input.athlete, ladder),
    warmUpCount: warmUpWeights.length,
  };
};

const buildPause = (
  set: SetTuple,
  skill: SkillCode,
  duration: number,
): GeneratedSetListEntry => ({
  branchId: PLACEHOLDER_BRANCH_ID,
  exerciseId: PAUSE_EXERCISE_ID,
  set,
  skill,
  duration,
});

const buildLiftSet = (
  lead: BranchExerciseReference,
  sets: MaxStrengthSets,
  index: number,
  skill: SkillCode,
): GeneratedSetListEntry => ({
  branchId: lead.branchId,
  exerciseId: lead.exerciseId,
  tags: [...lead.branchTags],
  set: [index + 1, sets.weights.length],
  skill,
  weight: sets.weights[index],
  repetition: sets.repetitions[index].repetitions,
  repetitionMAX: { ...sets.repetitions[index] },
});

const buildRestBetweenWorkingSets = (
  pool: ExerciseType[],
  tally: SupportExerciseTally,
  set: SetTuple,
  { skill, input, weightedShare, workingSetRests }: MaxStrengthContext,
): BuiltSetList => {
  const pick = pickSupportExercise(pool, tally, weightedShare, input.random);
  if (!pick) {
    return {
      setList: [buildPause(set, skill, workingSetRests.withoutSupport)],
      tally,
    };
  }
  const [firstSet, secondSet] = buildSupportSets(
    pick.exercise,
    input.athlete,
    set,
    skill,
  );
  return {
    setList: [
      buildPause(set, skill, BEFORE_SUPPORT_REST_SECONDS),
      firstSet,
      buildPause(set, skill, BETWEEN_SUPPORT_SETS_REST_SECONDS),
      secondSet,
      buildPause(set, skill, workingSetRests.afterSupport),
    ],
    tally: pick.tally,
  };
};

// The warm-up sets rest without support exercises; each rest between two
// working sets draws its support exercise in set order.
const buildExerciseSetList = (
  lead: BranchExerciseReference,
  exercise: ExerciseType,
  context: MaxStrengthContext,
  tally: SupportExerciseTally,
): BuiltSetList => {
  const { skill } = context;
  const sets = readMaxStrengthSets(exercise, context);
  const pool = listSupportExercises(exercise, context.input);
  const setList: GeneratedSetListEntry[] = [];
  let currentTally = tally;
  sets.weights.forEach((_, index) => {
    const set: SetTuple = [index + 1, sets.weights.length];
    setList.push(buildLiftSet(lead, sets, index, skill));
    if (index < sets.warmUpCount) {
      setList.push(buildPause(set, skill, WARM_UP_REST_SECONDS));
    } else if (index === sets.weights.length - 1) {
      setList.push(buildPause(set, skill, LAST_WORKING_SET_REST_SECONDS));
    } else {
      const built = buildRestBetweenWorkingSets(
        pool,
        currentTally,
        set,
        context,
      );
      setList.push(...built.setList);
      currentTally = built.tally;
    }
  });
  return { setList, tally: currentTally };
};

/**
 * Builds a max strength block: per exercise two warm-up sets, then the
 * working sets of its ladder at their F-Max weight. Between two working sets
 * rest two sets of a support exercise, drawn through `input.random`; each
 * support exercise appears at most once per block. The ladder sets the number
 * of sets and the max strength rules the rests, so the builder reads only the
 * block's skill. A lead missing from the catalog builds nothing.
 */
export const buildMaxStrengthSetList: SkillSetListBuilder = (
  pairs,
  block,
  input,
) => {
  const context: MaxStrengthContext = {
    skill: block.skill,
    input,
    maxValues:
      requireWorkoutData(input.athlete).maxValues ?? DEFAULT_MAX_VALUES,
    weightedShare: readWeightedSupportShare(input),
    workingSetRests:
      getUserLevel(input.athlete) === WorkoutConstants.LEVELS.PROFESSIONAL
        ? PROFESSIONAL_WORKING_SET_RESTS
        : DEFAULT_WORKING_SET_RESTS,
  };
  const exerciseMap = createExerciseMap(input.exerciseCatalog);
  const setList: GeneratedSetListEntry[] = [];
  let tally = EMPTY_SUPPORT_EXERCISE_TALLY;
  for (const { first } of pairs) {
    const exercise = exerciseMap.get(first.exerciseId);
    if (!exercise) continue;
    const built = buildExerciseSetList(first, exercise, context, tally);
    setList.push(...built.setList);
    tally = built.tally;
  }
  return setList;
};
