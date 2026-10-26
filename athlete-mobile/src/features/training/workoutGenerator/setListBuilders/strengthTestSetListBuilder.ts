import type { LevelTag } from "@/constants/workoutConstants";
import {
  PAUSE_EXERCISE_ID,
  PLACEHOLDER_BRANCH_ID,
} from "@/features/training/models/IdTypes";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { getUserGender } from "@/features/training/utils/userDataUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import type {
  ExercisesBlock,
  TestSet,
} from "@/schemas/strengthTestTemplate.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode, TestSetLoads } from "@/schemas/generator.schema";
import type { OneRepMaxShares } from "@/schemas/oneRepMaxShares.schema";
import type { UserType } from "@/schemas/user.schema";
import { readExerciseFMax } from "../exerciseValues/exerciseFMax";
import { roundWeight } from "../exerciseValues/weightRounding";
import type { GenerationInput } from "../generationInput/generationInput";
import type { PrescribedExerciseReference } from "../stages/blockWalk";
import type { PrescribedSetListBuilder } from "./setListBuilder";

/** The strength test data the builder reads beside the block. */
export interface StrengthTestLoadData {
  readonly testSetLoads: TestSetLoads;
  readonly oneRepMaxShares: OneRepMaxShares;
}

type LevelKey = keyof OneRepMaxShares;

const LEVEL_KEY: Record<LevelTag, LevelKey> = {
  BEGINNER: "beginner",
  ADVANCED: "advanced",
  PROFESSIONAL: "professional",
};

// -1 repetitions mark the AMRAP set in the set list.
const AMRAP_REPETITION = -1;

// Strength test loads may stay below the empty bar.
const TEST_ROUNDING = { emptyBarMinimum: false };

const readLevelKey = (athlete: UserType): LevelKey => {
  const level = getUserLevel(athlete);
  if (!Object.hasOwn(LEVEL_KEY, level)) {
    throw new Error(`Invalid userLevel for TEST_WORKOUT: ${level}`);
  }
  return LEVEL_KEY[level];
};

/**
 * Reads the test set load: the level's share of the lift's F-Max, else the
 * authored load for the athlete's gender and level. A lift without either
 * throws, so a data gap never builds a test at 0 kg.
 */
const readTestSetLoad = (
  exercise: ExerciseType,
  skill: SkillCode,
  athlete: UserType,
  { testSetLoads, oneRepMaxShares }: StrengthTestLoadData,
): number => {
  const level = readLevelKey(athlete);
  const fMax = readExerciseFMax(
    exercise,
    athlete.workoutData?.maxValues ?? DEFAULT_MAX_VALUES,
  );
  if (fMax) return fMax * oneRepMaxShares[level];
  const gender = getUserGender(athlete) === "MALE" ? "m" : "w";
  const loads = testSetLoads[exercise.id]?.[gender];
  if (!loads) {
    throw new Error(
      `${skill}: lift ${exercise.id} has no test set load for ${gender}`,
    );
  }
  return loads[level];
};

const buildLiftSetList = (
  exercise: ExerciseType,
  skill: SkillCode,
  testSets: readonly TestSet[],
  roundedTestSetLoad: number,
): GeneratedSetListEntry[] =>
  testSets.flatMap(({ share, repetitions, rest }, index) => {
    const set: [number, number] = [index + 1, testSets.length];
    return [
      {
        branchId: PLACEHOLDER_BRANCH_ID,
        exerciseId: exercise.id,
        set,
        weight: roundWeight(
          roundedTestSetLoad * share,
          exercise,
          TEST_ROUNDING,
        ),
        repetition: repetitions === "amrap" ? AMRAP_REPETITION : repetitions,
        skill,
      },
      {
        branchId: PLACEHOLDER_BRANCH_ID,
        exerciseId: PAUSE_EXERCISE_ID,
        set,
        duration: rest,
        skill,
      },
    ];
  });

/**
 * Builds the strength test for the prescribed lifts in list order: per lift
 * one set per authored test set at its share of the rounded test set load,
 * each followed by its rest. The entries hold the placeholder branch, so
 * completion moves no branch progression. A lift missing from the catalog
 * builds nothing; the exercises handler rejects it before.
 *
 * buildStrengthTestSetList(lifts, { skill: "TEST", testSets: [{ share: 0.4, repetitions: 6, rest: 60 }, ...] }, input, data)
 * → [25 1/4 6 reps, pause 60, ..., 25 4/4 AMRAP, pause 180]
 */
export const buildStrengthTestSetList = (
  lifts: readonly PrescribedExerciseReference[],
  block: Pick<ExercisesBlock, "skill" | "testSets">,
  input: GenerationInput,
  data: StrengthTestLoadData,
): GeneratedSetListEntry[] => {
  const { skill, testSets } = block;
  if (!testSets) {
    throw new Error(`${skill}: the strengthTest builder needs testSets`);
  }
  return lifts.flatMap(({ exerciseId }) => {
    const exercise = input.exerciseCatalog.find(({ id }) => id === exerciseId);
    if (!exercise) return [];
    const roundedTestSetLoad = roundWeight(
      readTestSetLoad(exercise, skill, input.athlete, data),
      exercise,
      TEST_ROUNDING,
    );
    return buildLiftSetList(exercise, skill, testSets, roundedTestSetLoad);
  });
};

/**
 * Binds the test set loads and 1RM shares of a strength test to its builder.
 * The block authors the test sets.
 *
 * createStrengthTestSetListBuilder({ testSetLoads: loadStrengthTest().testSetLoads, oneRepMaxShares: loadOneRepMaxShares() })
 * → { blockSettings: ["testSets"], build: (lifts, block, input) → [25 1/4, pause 60, ...] }
 */
export const createStrengthTestSetListBuilder = (
  data: StrengthTestLoadData,
): PrescribedSetListBuilder => ({
  blockSettings: ["testSets"],
  build: (lifts, block, input) =>
    buildStrengthTestSetList(lifts, block, input, data),
});
