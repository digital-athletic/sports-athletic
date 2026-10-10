import {
  type ExerciseDifficultyType,
  type LevelTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { MaxStrengthBuffer } from "@/schemas/generator.schema";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";
import { getRoundedResultForValueAndStep } from "./workoutUtils";

/** Repetitions per buffer and weight percentage of one level. */
export type BufferTable = Partial<
  Record<MaxStrengthBuffer, Record<number, number>>
>;

export interface MaxStrengthSetState {
  weightPercentage: number;
  level: MaxStrengthBuffer;
}

// Highest buffer first, so one step moves to the next buffer in this list.
const BUFFERS: MaxStrengthBuffer[] = ["EASY", "MEDIUM", "HARD"];
const WEIGHT_STEP = 2.5;

const isBuffer = (level: string): level is MaxStrengthBuffer =>
  BUFFERS.some((buffer) => buffer === level);

// The level comes from a user tag, so unknown values reach this point.
const setsFor = (levelTag: LevelTag) =>
  WorkoutConstants.MAX_KRAFT_SETS_PER_USER_LEVEL[levelTag] ??
  WorkoutConstants.MAX_KRAFT_SETS_PER_USER_LEVEL.ADVANCED;

const minimumWeightFor = (levelTag: LevelTag) =>
  WorkoutConstants.MAX_KRAFT_MINIMAL_WEIGHT_PERCENTAGE_PER_USER_LEVEL[
    levelTag
  ] ??
  WorkoutConstants.MAX_KRAFT_MINIMAL_WEIGHT_PERCENTAGE_PER_USER_LEVEL.ADVANCED;

const buffersAt = (table: BufferTable, weight: number) =>
  BUFFERS.filter((buffer) => table[buffer]?.[weight] !== undefined);

const firstStep = (
  table: BufferTable,
  levelTag: LevelTag,
  setIndex: number,
): MaxStrengthSetState => {
  const { startWeight } = setsFor(levelTag)[setIndex];
  // The very first step of Advanced set 1 starts in the 15% buffer.
  const level =
    levelTag !== WorkoutConstants.LEVELS.PROFESSIONAL && setIndex === 0
      ? "MEDIUM"
      : (buffersAt(table, startWeight)[0] ?? "EASY");
  return { weightPercentage: startWeight, level };
};

const step = (
  table: BufferTable,
  state: MaxStrengthSetState,
  maximumWeight: number,
): MaxStrengthSetState => {
  const nextBuffer = buffersAt(table, state.weightPercentage).find(
    (buffer) => BUFFERS.indexOf(buffer) > BUFFERS.indexOf(state.level),
  );
  if (nextBuffer) return { ...state, level: nextBuffer };
  const nextWeight = state.weightPercentage + WEIGHT_STEP;
  if (nextWeight > maximumWeight) return state;
  return {
    weightPercentage: nextWeight,
    level: buffersAt(table, nextWeight)[0] ?? state.level,
  };
};

interface WeightBounds {
  maximumWeight: number;
  minimumWeight: number;
}

const advance = (
  table: BufferTable,
  state: MaxStrengthSetState,
  { maximumWeight, minimumWeight }: WeightBounds,
  difficulty: ExerciseDifficultyType,
): MaxStrengthSetState => {
  switch (difficulty) {
    case "SUCCEEDED":
      return step(table, state, maximumWeight);
    case "TOO_EASY":
      return step(table, step(table, state, maximumWeight), maximumWeight);
    case "TOO_HARD":
      return {
        ...state,
        weightPercentage: Math.max(
          state.weightPercentage -
            WorkoutConstants.MAX_KRAFT_WEIGHT_ADJUSTMENT.TOO_HARD,
          Math.min(state.weightPercentage, minimumWeight),
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

const fromLastSet = (
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
  const weight = getRoundedResultForValueAndStep(
    nextWeightPercentage,
    WEIGHT_STEP,
  );
  return setsFor(levelTag).map(({ maximumWeight }) =>
    weight > maximumWeight
      ? {
          weightPercentage: maximumWeight,
          level: buffersAt(table, maximumWeight).at(-1) ?? level,
        }
      : { weightPercentage: weight, level },
  );
};

const hasWeightPercentage = (
  entry: MaxForceRepetitionsDataType,
): entry is MaxForceRepetitionsDataType & { weightPercentage: number } =>
  typeof entry.weightPercentage === "number";

const storedLastSet = (
  stored: MaxForceRepetitionsDataType[],
  nextWeightPercentage: number | undefined,
): StoredLastSet | undefined => {
  const last = stored.at(-1);
  return last && typeof nextWeightPercentage === "number"
    ? { last, nextWeightPercentage }
    : undefined;
};

const advancePerSet = (
  table: BufferTable,
  levelTag: LevelTag,
  perSet: (MaxForceRepetitionsDataType & { weightPercentage: number })[],
  difficulty: ExerciseDifficultyType,
): MaxStrengthSetState[] => {
  const minimumWeight = minimumWeightFor(levelTag);
  return setsFor(levelTag).map(({ maximumWeight }, i) =>
    advance(
      table,
      {
        weightPercentage: perSet[i].weightPercentage,
        level: isBuffer(perSet[i].level) ? perSet[i].level : "EASY",
      },
      { maximumWeight, minimumWeight },
      difficulty,
    ),
  );
};

/**
 * State of every working set for the next session. Each set moves along its
 * own ladder from its stored state, up to its own maximum weight.
 */
export function getNextMaxStrengthSetStates(
  table: BufferTable,
  levelTag: LevelTag,
  userExerciseData: UserExerciseDataType | undefined,
): MaxStrengthSetState[] {
  const sets = setsFor(levelTag);
  const stored = userExerciseData?.maxFRepetitions ?? [];
  const difficulty = userExerciseData?.feedback?.difficulty ?? null;
  const perSet = stored.filter(hasWeightPercentage);

  if (perSet.length === sets.length) {
    return advancePerSet(table, levelTag, perSet, difficulty);
  }
  // Per set entries of another set count stem from a level change, so the
  // new level's ladder starts over.
  const lastSet =
    perSet.length === 0
      ? storedLastSet(stored, userExerciseData?.nextWeightPercentage)
      : undefined;
  if (lastSet) return fromLastSet(table, levelTag, lastSet, difficulty);
  return sets.map((_, i) => firstStep(table, levelTag, i));
}

/**
 * Repetitions of a working set. An empty buffer falls back to the next buffer
 * that has a value; the returned level is the buffer actually used.
 */
export function getMaxStrengthRepetitions(
  table: BufferTable,
  weight: number,
  level: MaxStrengthBuffer,
): { level: MaxStrengthBuffer; repetitions: number } {
  let checkedLevel = level;
  let repetitions = table[checkedLevel]?.[weight];
  for (let i = 0; i < 2 && repetitions === undefined; i++) {
    checkedLevel = checkedLevel === "MEDIUM" ? "HARD" : "MEDIUM";
    repetitions = table[checkedLevel]?.[weight];
  }
  if (repetitions === undefined) {
    // corrupt data: min or max repetition count for high or low weight
    return { level, repetitions: weight > 80 ? 1 : 6 };
  }
  return { level: checkedLevel, repetitions };
}
