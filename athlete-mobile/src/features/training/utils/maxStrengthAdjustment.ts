import {
  type AgeGroupTag,
  type ExerciseDifficultyType,
  type LevelTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import type { GenderTag } from "@/features/training/models/Intensity";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";
import { getLastMaxFRep } from "./maxFRepetitionsUtils";
import {
  getMaxValueForExercise,
  getRoundedResultForValueAndStep,
} from "./workoutUtils";

export interface MaxStrengthAdjustmentInput {
  /** Weight lifted in the last (test) set of the MAX exercise. */
  weight: number;
  /** Feedback difficulty entered for the exercise this session. */
  adjustment: ExerciseDifficultyType;
  /** Resolved exercise definition (from the exercise registry); may be missing. */
  exerciseData: ExerciseType | undefined;
  /** The persisted user exercise entry holding maxFRepetitions. */
  userExerciseData: UserExerciseDataType | undefined;
  maxValues: MaxValuesType;
  ageGroup: AgeGroupTag;
  genderTag: GenderTag;
  levelTag: LevelTag | undefined;
  userLevel: TrainingLevelType | undefined;
}

export interface MaxStrengthAdjustmentResult {
  /** Weight percentage to seed the next session, or undefined when unknown. */
  nextWeightPercentage: number | undefined;
  /** The user's existing maxFRepetitions, carried over unchanged. */
  maxFRepetitions: MaxForceRepetitionsDataType[];
  levelUp: boolean;
  levelDown: boolean;
  /** True when the weight percentage was increased or decreased. */
  weightAdjusted: boolean;
  /** Feedback the caller must persist before the main update; undefined skips it. */
  feedbackOverride?: { difficulty: ExerciseDifficultyType };
}

const BUFFER_COLUMNS = ["EASY", "MEDIUM", "HARD"];

/**
 * True when no buffer column after `level` has repetitions at the weight, so
 * the next step raises the weight. Pro below 75% has no 5% (HARD) column.
 */
export function isLastBufferColumn(
  levelReps: Record<string, Record<number, number>> | undefined,
  weightPercentage: number | null,
  level: string | undefined,
): boolean {
  if (level === "HARD") return true;
  const index = BUFFER_COLUMNS.indexOf(level ?? "");
  if (
    !level ||
    index === -1 ||
    !levelReps ||
    weightPercentage === null ||
    levelReps[level]?.[weightPercentage] === undefined
  ) {
    return false;
  }
  return BUFFER_COLUMNS.slice(index + 1).every(
    (column) => levelReps[column]?.[weightPercentage] === undefined,
  );
}

/** F-Max percentage of a weight, rounded to the 2.5 ladder step. */
export function getMaxStrengthWeightPercentage(
  weight: number,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
): number | null {
  const maxValue = exerciseData
    ? getMaxValueForExercise(exerciseData, maxValues)
    : null;
  return typeof maxValue === "number"
    ? getRoundedResultForValueAndStep((weight / maxValue) * 100, 2.5)
    : null;
}

/**
 * Pure inter-session progression for MAX (Maximalkraft) exercises. Side effects
 * (store writes, branch level changes) remain the caller's responsibility,
 * driven by the returned result.
 */
export function calculateMaxStrengthAdjustment(
  input: MaxStrengthAdjustmentInput,
): MaxStrengthAdjustmentResult {
  const {
    weight,
    adjustment,
    exerciseData,
    userExerciseData,
    maxValues,
    ageGroup,
    genderTag,
    levelTag,
    userLevel,
  } = input;

  const weightPercentage = getMaxStrengthWeightPercentage(
    weight,
    exerciseData,
    maxValues,
  );
  const maxFRepetitions = userExerciseData?.maxFRepetitions ?? [];
  const lastMaxFRep = getLastMaxFRep(userExerciseData?.maxFRepetitions);

  let increaseWeight = false;
  let decreaseWeight = false;
  let levelUp = false;
  let levelDown = false;
  const levelReps =
    ageGroup !== "CHILD" && levelTag
      ? WorkoutConstants.MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT[
          ageGroup
        ]?.[levelTag]
      : undefined;
  const maxFRepsHard = levelReps?.HARD ?? null;
  const atLastColumn = isLastBufferColumn(
    levelReps,
    weightPercentage,
    lastMaxFRep?.level,
  );

  let maximumWeightPercentage =
    ageGroup !== "CHILD" && maxFRepsHard
      ? Math.max(
          Object.keys(maxFRepsHard)
            .map(parseInt)
            .filter((v) => !isNaN(v))
            .sort((a, b) => b - a)[0],
        )
      : null;
  // set exercise targetValue if entered from webTool
  const targetValue = exerciseData?.values?.weight?.targetValue;
  if (targetValue) {
    if (userLevel && targetValue[genderTag]?.[userLevel]) {
      maximumWeightPercentage = Number(targetValue[genderTag][userLevel]);
    } else if (userLevel && targetValue.default?.[userLevel]) {
      maximumWeightPercentage = Number(targetValue.default[userLevel]);
    }
  }
  let minimumWeightPercentage = levelTag
    ? WorkoutConstants.MAX_KRAFT_MINIMAL_WEIGHT_PERCENTAGE_PER_USER_LEVEL[
        levelTag
      ]
    : null;
  // set exercise startValue if entered from webTool
  if (exerciseData?.values?.weight?.startValue) {
    if (
      userLevel &&
      exerciseData?.values.weight?.startValue?.[genderTag]?.[userLevel]
    ) {
      minimumWeightPercentage = Number(
        exerciseData?.values.weight.startValue[genderTag][userLevel],
      );
    } else if (
      userLevel &&
      exerciseData?.values.weight?.startValue?.default?.[userLevel]
    ) {
      minimumWeightPercentage = Number(
        exerciseData?.values.weight.startValue.default[userLevel],
      );
    }
  }

  let feedbackOverride: { difficulty: ExerciseDifficultyType } | undefined;
  if (
    (typeof weightPercentage === "number" &&
      typeof maximumWeightPercentage === "number" &&
      weightPercentage >= maximumWeightPercentage &&
      atLastColumn &&
      adjustment !== "TOO_HARD") ||
    (lastMaxFRep?.level === "MEDIUM" && adjustment === "TOO_EASY")
  ) {
    // No adjustment if max lvl and max weight is already reached
    feedbackOverride = { difficulty: null };
    levelUp = true;
  } else if (
    typeof weightPercentage === "number" &&
    typeof minimumWeightPercentage === "number" &&
    weightPercentage <= minimumWeightPercentage &&
    adjustment === "TOO_HARD"
  ) {
    // No adjustment if min weight is already too hard -> levelDown
    feedbackOverride = { difficulty: null };
    levelDown = true;
  } else if (
    typeof weightPercentage === "number" &&
    typeof maximumWeightPercentage === "number" &&
    weightPercentage >= maximumWeightPercentage &&
    lastMaxFRep?.level === "MEDIUM" &&
    adjustment === "TOO_EASY"
  ) {
    // No TOO_EASY adjustment if max lvl and max weight will be reached
    feedbackOverride = { difficulty: "SUCCEEDED" };
  } else {
    // adjust weight if needed
    if (
      (atLastColumn && adjustment !== "TOO_HARD") ||
      (lastMaxFRep?.level === "MEDIUM" && adjustment === "TOO_EASY")
    ) {
      // adjust weight up if jumping over the last column of this weight
      increaseWeight = true;
    } else if (adjustment === "TOO_HARD") {
      // adjust only weight down if is TOO_HARD
      decreaseWeight = true;
    }
  }
  let nextWeightPercentage = weightPercentage ?? undefined;
  if (increaseWeight || decreaseWeight) {
    if (increaseWeight && typeof nextWeightPercentage === "number") {
      nextWeightPercentage +=
        WorkoutConstants.MAX_KRAFT_WEIGHT_ADJUSTMENT["SUCCEEDED"];
    } else if (typeof nextWeightPercentage === "number") {
      nextWeightPercentage -=
        WorkoutConstants.MAX_KRAFT_WEIGHT_ADJUSTMENT["TOO_HARD"];
    }
    // minimum weightPercentage for user
    if (
      typeof nextWeightPercentage === "number" &&
      typeof minimumWeightPercentage === "number" &&
      nextWeightPercentage < minimumWeightPercentage
    )
      nextWeightPercentage = minimumWeightPercentage;
    // prevent bigger than maximum
    if (
      typeof nextWeightPercentage === "number" &&
      typeof maximumWeightPercentage === "number" &&
      nextWeightPercentage > maximumWeightPercentage
    )
      nextWeightPercentage = maximumWeightPercentage;
  }

  return {
    nextWeightPercentage,
    maxFRepetitions,
    levelUp,
    levelDown,
    weightAdjusted: increaseWeight || decreaseWeight,
    feedbackOverride,
  };
}
