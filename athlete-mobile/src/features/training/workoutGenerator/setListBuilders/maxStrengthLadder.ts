import {
  type ExerciseDifficultyType,
  type LevelTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import type { ExerciseProgressSourceType } from "@/features/training/models/ExerciseProgress";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import { readOwnExerciseProgress } from "@/features/training/utils/exerciseProgressLookup";
import { getUserBirthday } from "@/features/training/utils/userDataUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  MaxStrengthBuffer,
  MaxTrainingRepsEntry,
  MaxTrainingWeightsResult,
  SkillCode,
} from "@/schemas/generator.schema";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";
import type { UserType } from "@/schemas/user.schema";

/** Repetitions per buffer and weight percentage of one level. */
type BufferTable = Partial<Record<MaxStrengthBuffer, Record<number, number>>>;

interface MaxStrengthSetState {
  weightPercentage: number;
  level: MaxStrengthBuffer;
}

// Highest buffer first, so one step moves to the next buffer in this list.
const BUFFERS: MaxStrengthBuffer[] = ["EASY", "MEDIUM", "HARD"];
const WEIGHT_STEP = 2.5;
const FLOOR_WEIGHT = WorkoutConstants.MAX_STRENGTH_FLOOR_WEIGHT_PERCENTAGE;

const isBuffer = (level: string): level is MaxStrengthBuffer =>
  BUFFERS.some((buffer) => buffer === level);

// The level comes from a user tag, so unknown values reach this point.
const readLevelSets = (levelTag: LevelTag) =>
  WorkoutConstants.MAX_STRENGTH_SETS_PER_USER_LEVEL[levelTag] ??
  WorkoutConstants.MAX_STRENGTH_SETS_PER_USER_LEVEL.ADVANCED;

const listBuffersAt = (table: BufferTable, weight: number) =>
  BUFFERS.filter((buffer) => table[buffer]?.[weight] !== undefined);

const roundToWeightStep = (value: number) => {
  const remainder = value % WEIGHT_STEP;
  return remainder < WEIGHT_STEP / 2
    ? value - remainder
    : value + WEIGHT_STEP - remainder;
};

const readFirstStep = (
  table: BufferTable,
  levelTag: LevelTag,
  setIndex: number,
): MaxStrengthSetState => {
  const { startWeight } = readLevelSets(levelTag)[setIndex];
  // The very first step of Advanced set 1 starts in the 15% buffer.
  const level =
    levelTag !== WorkoutConstants.LEVELS.PROFESSIONAL && setIndex === 0
      ? "MEDIUM"
      : (listBuffersAt(table, startWeight)[0] ?? "EASY");
  return { weightPercentage: startWeight, level };
};

const takeStep = (
  table: BufferTable,
  state: MaxStrengthSetState,
  maximumWeight: number,
): MaxStrengthSetState => {
  const nextBuffer = listBuffersAt(table, state.weightPercentage).find(
    (buffer) => BUFFERS.indexOf(buffer) > BUFFERS.indexOf(state.level),
  );
  if (nextBuffer) return { ...state, level: nextBuffer };
  const nextWeight = state.weightPercentage + WEIGHT_STEP;
  if (nextWeight > maximumWeight) return state;
  return {
    weightPercentage: nextWeight,
    level: listBuffersAt(table, nextWeight)[0] ?? state.level,
  };
};

const advanceSetState = (
  table: BufferTable,
  state: MaxStrengthSetState,
  maximumWeight: number,
  difficulty: ExerciseDifficultyType,
): MaxStrengthSetState => {
  switch (difficulty) {
    case "SUCCEEDED":
      return takeStep(table, state, maximumWeight);
    case "TOO_EASY":
      return takeStep(
        table,
        takeStep(table, state, maximumWeight),
        maximumWeight,
      );
    case "TOO_HARD":
      return {
        ...state,
        weightPercentage: Math.max(
          state.weightPercentage - WEIGHT_STEP,
          Math.min(state.weightPercentage, FLOOR_WEIGHT),
        ),
      };
    default:
      return state;
  }
};

const LEGACY_NEXT_LEVEL: Record<
  "SUCCEEDED" | "TOO_EASY",
  Record<MaxStrengthBuffer, MaxStrengthBuffer>
> = {
  SUCCEEDED: { EASY: "MEDIUM", MEDIUM: "HARD", HARD: "EASY" },
  TOO_EASY: { EASY: "HARD", MEDIUM: "EASY", HARD: "MEDIUM" },
};

// Entries stored before per set ladders hold only the last set; its weight is
// the adjusted nextWeightPercentage. Every set takes that state, capped at its
// maximum weight.
interface StoredLastSet {
  last: MaxForceRepetitionsDataType;
  nextWeightPercentage: number;
}

const readSetStatesFromLastSet = (
  table: BufferTable,
  levelTag: LevelTag,
  { last, nextWeightPercentage }: StoredLastSet,
  difficulty: ExerciseDifficultyType,
): MaxStrengthSetState[] => {
  const lastLevel = isBuffer(last.level) ? last.level : "EASY";
  const level =
    difficulty === "SUCCEEDED" || difficulty === "TOO_EASY"
      ? LEGACY_NEXT_LEVEL[difficulty][lastLevel]
      : lastLevel;
  const weight = roundToWeightStep(nextWeightPercentage);
  return readLevelSets(levelTag).map(({ maximumWeight }) =>
    weight > maximumWeight
      ? {
          weightPercentage: maximumWeight,
          level: listBuffersAt(table, maximumWeight).at(-1) ?? level,
        }
      : { weightPercentage: weight, level },
  );
};

const hasWeightPercentage = (
  entry: MaxForceRepetitionsDataType,
): entry is MaxForceRepetitionsDataType & { weightPercentage: number } =>
  typeof entry.weightPercentage === "number";

const readStoredLastSet = (
  stored: MaxForceRepetitionsDataType[],
  nextWeightPercentage: number | undefined,
): StoredLastSet | undefined => {
  const last = stored.at(-1);
  return last && typeof nextWeightPercentage === "number"
    ? { last, nextWeightPercentage }
    : undefined;
};

const convertToSetState = (
  entry: MaxForceRepetitionsDataType & { weightPercentage: number },
): MaxStrengthSetState => ({
  weightPercentage: entry.weightPercentage,
  level: isBuffer(entry.level) ? entry.level : "EASY",
});

// Each set moves along its own ladder from its stored state, up to its own
// maximum weight. Per set entries of another set count stem from a level
// change, so the new level's ladder starts over.
const readNextSetStates = (
  table: BufferTable,
  levelTag: LevelTag,
  exerciseData: UserExerciseDataType | undefined,
): MaxStrengthSetState[] => {
  const sets = readLevelSets(levelTag);
  const stored = exerciseData?.maxFRepetitions ?? [];
  const difficulty = exerciseData?.feedback?.difficulty ?? null;
  const perSet = stored.filter(hasWeightPercentage);
  if (perSet.length === sets.length) {
    return sets.map(({ maximumWeight }, i) =>
      advanceSetState(
        table,
        convertToSetState(perSet[i]),
        maximumWeight,
        difficulty,
      ),
    );
  }
  const lastSet =
    perSet.length === 0
      ? readStoredLastSet(stored, exerciseData?.nextWeightPercentage)
      : undefined;
  if (lastSet) {
    return readSetStatesFromLastSet(table, levelTag, lastSet, difficulty);
  }
  return sets.map((_, i) => readFirstStep(table, levelTag, i));
};

// An empty buffer falls back to the next buffer that has a value; the
// returned level is the buffer actually used.
const readSetRepetitions = (
  table: BufferTable,
  weight: number,
  level: MaxStrengthBuffer,
): { level: MaxStrengthBuffer; repetitions: number } => {
  let checkedLevel = level;
  let repetitions = table[checkedLevel]?.[weight];
  for (let i = 0; i < 2 && repetitions === undefined; i++) {
    checkedLevel = checkedLevel === "MEDIUM" ? "HARD" : "MEDIUM";
    repetitions = table[checkedLevel]?.[weight];
  }
  if (repetitions === undefined) {
    // Corrupt data: the lowest or highest count for a high or low weight.
    return { level, repetitions: weight > 80 ? 1 : 6 };
  }
  return { level: checkedLevel, repetitions };
};

const readBufferTable = (athlete: UserType): BufferTable => {
  const ageRepetitions =
    WorkoutConstants.MAX_STRENGTH_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT[
      ageGroupFor(getUserBirthday(athlete))
    ];
  return ageRepetitions?.[getUserLevel(athlete)] ?? {};
};

/**
 * Reads the weight percentage and buffer of every max strength working set
 * for the next session. Each set follows its own ladder between its starting
 * and maximum weight. Only a record the skill wrote last moves the ladder.
 */
export const readMaxTrainingWeights = (
  exercise: ExerciseType,
  athlete: UserType,
  exerciseData: Readonly<ExerciseProgressSourceType> | null,
  skill: SkillCode,
): MaxTrainingWeightsResult => {
  const states = readNextSetStates(
    readBufferTable(athlete),
    getUserLevel(athlete),
    readOwnExerciseProgress(exerciseData, skill, exercise.id) ?? undefined,
  );
  return {
    trainingWeights: states.map((state) => state.weightPercentage),
    levels: states.map((state) => state.level),
  };
};

/**
 * Reads the repetitions of the warm-up sets followed by those of each working
 * set. Working set entries record the buffer actually used and their weight
 * percentage, so the next session continues each set's own ladder.
 */
export const readMaxTrainingRepetitions = (
  athlete: UserType,
  { trainingWeights, levels }: MaxTrainingWeightsResult,
): MaxTrainingRepsEntry[] => {
  const table = readBufferTable(athlete);
  const workingRepetitions = trainingWeights.map((weightPercentage, i) => ({
    ...readSetRepetitions(table, weightPercentage, levels[i]),
    weightPercentage,
  }));
  return [
    ...WorkoutConstants.MAX_STRENGTH_REPETITIONS_WARMUP,
    ...workingRepetitions,
  ];
};
