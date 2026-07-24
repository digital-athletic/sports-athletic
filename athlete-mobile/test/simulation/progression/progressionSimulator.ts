/**
 * Deterministic, framework-agnostic progression harness. Drives the real
 * training generator through N consecutive sessions with scripted feedback and
 * records a per-set snapshot each session, so weight/rep progression can be
 * audited against golden tables and coded invariants.
 *
 * Scope: reconstructs the MAX (Maximalkraft) intra-session set list from
 * `getMaxTrainingWeights` + `getMaxTrainingReps` and closes the inter-session
 * loop through `calculateMaxStrengthAdjustment`. Warm-up loads are derived per
 * spec section 2 (50% / 75% of the displayed weight of the 1st working set);
 * support exercises (assembled in `getSetListFromExercisePairs`) remain out of
 * scope. The progression under test is the working sets.
 */
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { ExerciseDifficultyType } from "@/constants/workoutConstants";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
import {
  computeWarmupTrainingWeights,
  WARMUP_REST_SECONDS,
  WARMUP_WEIGHT_PERCENTAGES,
} from "@/features/training/generators/warmupDerivation";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { calculateMaxStrengthAdjustment } from "@/features/training/utils/maxStrengthAdjustment";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import { getUserBirthday } from "@/features/training/utils/userDataUtils";
import {
  deriveWeightForExercise,
  getMaxValueForExercise,
  getUserLevel,
} from "@/features/training/utils/workoutUtils";
import type { SkillCode } from "@/schemas/generator.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { MAX_FORCE_LEVELS } from "@/schemas/sync.schema";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { FeedbackScript } from "./feedbackScripts";
import {
  personaGenderTag,
  personaToUser,
  type LegacyPersona,
} from "./personaAdapter";

export interface SetSnapshot {
  setNumber: number;
  isWarmup: boolean;
  /**
   * Working sets: percent of F-Max. Warm-ups: percent of the 1st working
   * set's displayed weight (spec section 2), since the spec defines warm-up
   * loads relative to that set, not to F-Max.
   */
  percentage: number | null;
  weightKg: number;
  reps: number;
  pauseSeconds: number;
}

export interface ExerciseSnapshot {
  exerciseId: string;
  displayName: string;
  maxValue: number;
  weightPercentageBefore: number | null;
  levelBefore: string;
  sets: SetSnapshot[];
  feedbackGiven: ExerciseDifficultyType;
  /** What the adjustment actually persists; differs from `feedbackGiven` when overridden. */
  feedbackApplied: ExerciseDifficultyType;
  weightPercentageAfter: number | null;
  /** Level applied next session; null for the last simulated session. */
  levelAfter: string | null;
}

export interface SessionSnapshot {
  session: number;
  focus: SkillCode;
  exercises: ExerciseSnapshot[];
}

export interface SimulateOptions {
  sessions: number;
  feedback: FeedbackScript;
  /** Absolute strength values so percentages resolve to realistic kg. */
  maxValues?: MaxValuesType;
}

function isMaxLevel(
  level: string,
): level is MaxForceRepetitionsDataType["level"] {
  return (MAX_FORCE_LEVELS as readonly string[]).includes(level);
}

/**
 * Simulate `opts.sessions` consecutive sessions of a single focus exercise for
 * a persona. Currently supports `MAX_KRAFT`; other focuses are a future
 * data-only extension (add a branch, not a harness rewrite).
 */
export function simulateProgression(
  persona: LegacyPersona,
  exercise: ExerciseType,
  focus: SkillCode,
  opts: SimulateOptions,
): SessionSnapshot[] {
  if (focus !== "MAX_KRAFT") {
    throw new Error(
      `simulateProgression: focus "${focus}" is not yet implemented; only MAX_KRAFT is supported.`,
    );
  }

  const maxValues = opts.maxValues ?? DEFAULT_MAX_VALUES;
  const generator = new TrainingGenerator();
  const user = personaToUser(persona, maxValues);
  const genderTag = personaGenderTag(persona);
  const levelTag = getUserLevel(user);
  const userLevel = levelTag.toLowerCase() as TrainingLevelType;
  const ageGroup = ageGroupFor(getUserBirthday(user));
  const maxValue = getMaxValueForExercise(exercise, maxValues) ?? 0;
  const warmupCount = WorkoutConstants.MAX_KRAFT_REPETITIONS_WARMUP.length;
  const afterSetPause = generator.getAfterSetPauseBySkill("MAX_KRAFT");

  let userExercisesData: Record<string, UserExerciseDataType | undefined> = {};
  const sessions: SessionSnapshot[] = [];

  for (let session = 1; session <= opts.sessions; session++) {
    const prev = userExercisesData[exercise.id];
    const weightPercentageBefore = prev?.nextWeightPercentage ?? null;

    const weightsObj = generator.getMaxTrainingWeights(
      exercise,
      user,
      userExercisesData,
    );
    const repsEntries = generator.getMaxTrainingReps(
      user,
      weightsObj,
      userExercisesData,
      exercise,
      genderTag,
    );

    const workingReps = repsEntries.slice(warmupCount);

    const warmupTrainingWeights = computeWarmupTrainingWeights(
      weightsObj.trainingWeights[0],
    );

    const sets: SetSnapshot[] = repsEntries
      .slice(0, warmupCount)
      .map((entry, i) => {
        const warmupPercentage = WARMUP_WEIGHT_PERCENTAGES[i] ?? null;
        return {
          setNumber: i + 1,
          isWarmup: true,
          percentage: warmupPercentage,
          weightKg:
            deriveWeightForExercise(
              warmupTrainingWeights[i],
              "weightFMax",
              exercise,
              maxValues,
            ) ?? 0,
          reps: entry.repetitions,
          pauseSeconds: WARMUP_REST_SECONDS,
        };
      });

    workingReps.forEach((entry, i) => {
      const percentage = weightsObj.trainingWeights[i];
      const weightKg =
        deriveWeightForExercise(
          percentage,
          "weightFMax",
          exercise,
          maxValues,
        ) ?? 0;
      sets.push({
        setNumber: warmupCount + i + 1,
        isWarmup: false,
        percentage,
        weightKg,
        reps: entry.repetitions,
        pauseSeconds: afterSetPause,
      });
    });

    const levelBefore = workingReps[0]?.level ?? "EASY";
    const feedbackGiven = opts.feedback({ session });

    const recordedReps: MaxForceRepetitionsDataType[] = workingReps.map(
      (entry) => {
        if (!isMaxLevel(entry.level)) {
          throw new Error(`Generator returned unknown level "${entry.level}"`);
        }
        return { level: entry.level, repetitions: entry.repetitions };
      },
    );

    // The screen feeds the adjustment THIS session's generated entry (its
    // per-set `repetitionMAX` becomes `maxFRepetitions` via toUserExerciseData),
    // so the weight-increase gate reads the level applied this session, not the
    // previous one. Mirror that: carry `prev` forward but override the reps.
    const currentEntry: UserExerciseDataType = {
      ...prev,
      exerciseId: exercise.id,
      skill: focus,
      maxFRepetitions: recordedReps,
    };

    const lastWorkingSet = sets.filter((s) => !s.isWarmup).at(-1);
    const adjustment = calculateMaxStrengthAdjustment({
      weight: lastWorkingSet?.weightKg ?? 0,
      adjustment: feedbackGiven,
      exerciseData: exercise,
      userExerciseData: currentEntry,
      maxValues,
      ageGroup,
      genderTag,
      levelTag,
      userLevel,
    });

    const persistedDifficulty = adjustment.feedbackOverride
      ? adjustment.feedbackOverride.difficulty
      : feedbackGiven;

    sessions.push({
      session,
      focus,
      exercises: [
        {
          exerciseId: exercise.id,
          displayName: exercise.displayName ?? exercise.name ?? exercise.id,
          maxValue,
          weightPercentageBefore,
          levelBefore,
          sets,
          feedbackGiven,
          feedbackApplied: persistedDifficulty,
          weightPercentageAfter:
            adjustment.nextWeightPercentage ?? weightPercentageBefore,
          levelAfter: null,
        },
      ],
    });

    userExercisesData = {
      ...userExercisesData,
      [exercise.id]: {
        ...currentEntry,
        nextWeightPercentage: adjustment.nextWeightPercentage,
        feedback: { difficulty: persistedDifficulty },
      },
    };
  }

  // Link levelAfter to the next session's applied level (real generator output,
  // no duplicated transition logic); the last session's stays null (unknown).
  sessions.forEach((s, i) => {
    const next = sessions[i + 1];
    if (next) s.exercises[0].levelAfter = next.exercises[0].levelBefore;
  });

  return sessions;
}
