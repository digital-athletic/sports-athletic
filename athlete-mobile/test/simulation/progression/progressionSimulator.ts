/**
 * Deterministic, framework-agnostic progression harness. Drives the real
 * training generator through N consecutive sessions with scripted feedback and
 * records a per-set snapshot each session, so weight/rep progression can be
 * audited against golden tables and coded invariants.
 *
 * Every recorded value comes from the production path: the sets are read off
 * `getSetListFromExercisePairs` (the assembly the app renders) and the
 * inter-session step replays `useExerciseCompletion`, driving the real
 * `exerciseProgressStore` so the state carried into the next session is the
 * state the app would hold.
 *
 * Out of scope: branch level changes. Production hands `levelUp`/`levelDown` to
 * `updateBranchLevel`, which can swap the exercise for a harder or easier one.
 * The harness stays on a single exercise and records the flag instead, so any
 * session following a flagged one no longer mirrors the app.
 */
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { ExerciseDifficultyType } from "@/constants/workoutConstants";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
import { WARMUP_WEIGHT_PERCENTAGES } from "@/features/training/generators/warmupDerivation";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { calculateMaxStrengthAdjustment } from "@/features/training/utils/maxStrengthAdjustment";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import { getUserBirthday } from "@/features/training/utils/userDataUtils";
import {
  getMaxValueForExercise,
  getUserLevel,
} from "@/features/training/utils/workoutUtils";
import type { SkillCode } from "@/schemas/generator.schema";
import { toUserExerciseData } from "@/schemas/generator.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { TrainingLevelType } from "@/schemas/common.schema";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import type { FeedbackScript } from "./feedbackScripts";
import {
  personaGenderTag,
  personaToUser,
  type LegacyPersona,
} from "./personaAdapter";

const SIMULATED_BRANCH_ID = "progression-simulator-branch";

/** Ignored by the MAX branch, which sizes the set count from the user level. */
const SETS_PER_EXERCISE = 3;

export interface SetSnapshot {
  setNumber: number;
  isWarmup: boolean;
  /**
   * Working sets: percent of F-Max. Warm-ups: the nominal percentage of the 1st
   * working set, which the applied load only approximates because
   * `computeWarmupTrainingWeights` floors it.
   */
  percentage: number | null;
  weightKg: number;
  reps: number;
  /**
   * Gap to the next set of this exercise, support work included. On the closing
   * set it is the 2 min rest before the next exercise.
   */
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
  /** Buffer column of the last working set in the following session. */
  levelAfter: string;
  /** Recorded only; the harness does not model the exercise swap it triggers. */
  branchLevelChange: "up" | "down" | null;
}

export interface SessionSnapshot {
  session: number;
  focus: SkillCode;
  exercises: ExerciseSnapshot[];
}

/** A recorded session before `levelAfter` is known; see `simulateProgression`. */
interface PendingSession {
  session: number;
  focus: SkillCode;
  exercise: Omit<ExerciseSnapshot, "levelAfter">;
}

export interface SimulateOptions {
  sessions: number;
  feedback: FeedbackScript;
  /**
   * Must hold the exercise under test plus SUPPORT exercises clearing the
   * equipment filter, which production puts between the working sets. Mixing
   * timed and rep-based support exercises makes `pauseSeconds` depend on the
   * generator's random pick, so keep the pool uniform for stable goldens.
   */
  exercises: ExerciseType[];
  /** Absolute strength values so percentages resolve to realistic kg. */
  maxValues?: MaxValuesType;
}

/**
 * Turns the generated set list into per-set snapshots. Pause entries and
 * support exercises are not sets of their own; their duration folds into the
 * preceding set's `pauseSeconds`, which is what the athlete actually rests.
 */
function toSetSnapshots(
  setList: GeneratedSetListEntry[],
  exerciseId: string,
  workingPercentages: number[],
): SetSnapshot[] {
  const mainIndices = setList.reduce<number[]>((indices, entry, index) => {
    if (entry.exerciseId === exerciseId) indices.push(index);
    return indices;
  }, []);
  let warmupCount = 0;

  return mainIndices.map((entryIndex, setIndex) => {
    const entry = setList[entryIndex];
    const nextEntryIndex = mainIndices[setIndex + 1] ?? setList.length;
    // Production labels its warm-up sets, so they need no positional guessing.
    const isWarmup = entry.repetitionMAX?.level === "WARMUP";
    const percentage = isWarmup
      ? WARMUP_WEIGHT_PERCENTAGES[warmupCount++]
      : workingPercentages[setIndex - warmupCount];
    return {
      setNumber: setIndex + 1,
      isWarmup,
      percentage: percentage ?? null,
      weightKg: entry.weight ?? 0,
      reps: entry.repetition ?? 0,
      pauseSeconds: setList
        .slice(entryIndex + 1, nextEntryIndex)
        .reduce((seconds, next) => seconds + (next.duration ?? 0), 0),
    };
  });
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
  const ageGroup = ageGroupFor(getUserBirthday(user));
  // Production tags children "k" regardless of gender (useExerciseCompletion).
  const genderTag =
    ageGroup === WorkoutConstants.AGE_GROUPS.CHILD
      ? "k"
      : personaGenderTag(persona);
  const levelTag = getUserLevel(user);
  const userLevel = levelTag.toLowerCase() as TrainingLevelType;
  const maxValue = getMaxValueForExercise(exercise, maxValues) ?? 0;
  const exercisePairs = [
    {
      first: {
        branchId: SIMULATED_BRANCH_ID,
        branchTags: [],
        exerciseId: exercise.id,
      },
    },
  ];

  const { resetProgress, updateExercise } = useExerciseProgressStore.getState();
  const progressOf = (exerciseId: string) =>
    useExerciseProgressStore.getState().exerciseData[exerciseId];
  resetProgress();
  const pending: PendingSession[] = [];

  // One session past the requested count: a session's `levelAfter` is only
  // observable by generating the next one. The extra row is dropped below.
  for (let session = 1; session <= opts.sessions + 1; session++) {
    const weightPercentageBefore =
      progressOf(exercise.id)?.nextWeightPercentage ?? null;
    const userExercisesData = useExerciseProgressStore.getState().exerciseData;

    const setList = generator.getSetListFromExercisePairs(
      exercisePairs,
      { skill: focus, length: 0 },
      {},
      user,
      "HOME",
      [],
      opts.exercises,
      SETS_PER_EXERCISE,
      [],
      userExercisesData,
    );

    // The set list carries kg only; the percentages come from the same
    // generator call production makes internally, purely to annotate the table.
    const { trainingWeights } = generator.getMaxTrainingWeights(
      exercise,
      user,
      userExercisesData,
    );
    const sets = toSetSnapshots(setList, exercise.id, trainingWeights);

    // What the screen reads: the exercise's last entry in the training list.
    const lastEntry = setList.findLast((e) => e.exerciseId === exercise.id);
    const currentEntry = lastEntry ? toUserExerciseData(lastEntry) : undefined;
    const levelBefore = currentEntry?.maxFRepetitions?.at(-1)?.level ?? "EASY";

    const feedbackGiven = opts.feedback({ session });
    const adjustment = calculateMaxStrengthAdjustment({
      weight: lastEntry?.weight ?? 0,
      adjustment: feedbackGiven,
      exerciseData: exercise,
      userExerciseData: currentEntry,
      maxValues,
      ageGroup,
      genderTag,
      levelTag,
      userLevel,
    });

    // Same write order as the screen; the store's streak counter depends on it.
    updateExercise(exercise.id, {
      exerciseId: exercise.id,
      skill: focus,
      feedback: { difficulty: feedbackGiven },
    });
    if (adjustment.feedbackOverride) {
      updateExercise(exercise.id, {
        exerciseId: exercise.id,
        skill: focus,
        feedback: adjustment.feedbackOverride,
      });
    }
    updateExercise(exercise.id, {
      exerciseId: exercise.id,
      skill: focus,
      weight: lastEntry?.weight,
      nextWeightPercentage: adjustment.nextWeightPercentage,
      maxFRepetitions: adjustment.maxFRepetitions,
      maxFLevelAdjustment: feedbackGiven,
    });

    pending.push({
      session,
      focus,
      exercise: {
        exerciseId: exercise.id,
        displayName: exercise.displayName ?? exercise.name ?? exercise.id,
        maxValue,
        weightPercentageBefore,
        levelBefore,
        sets,
        feedbackGiven,
        feedbackApplied: progressOf(exercise.id)?.feedback?.difficulty ?? null,
        weightPercentageAfter:
          adjustment.nextWeightPercentage ?? weightPercentageBefore,
        branchLevelChange: adjustment.levelUp
          ? "up"
          : adjustment.levelDown
            ? "down"
            : null,
      },
    });
  }

  // levelAfter reads the next session's applied level off the real generator
  // output, so no transition logic is duplicated here. The extra session that
  // supplies it for the final row is discarded.
  return pending
    .slice(0, opts.sessions)
    .map(({ session, focus, exercise }, i) => ({
      session,
      focus,
      exercises: [
        { ...exercise, levelAfter: pending[i + 1].exercise.levelBefore },
      ],
    }));
}
