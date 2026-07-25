/**
 * Deterministic, framework-agnostic progression harness. Drives the real
 * training generator through N consecutive sessions with scripted feedback and
 * records a per-set snapshot each session, so weight/rep progression can be
 * audited against golden tables and coded invariants.
 *
 * Every recorded value comes from the production path: the sets are read off
 * `getSetListFromExercisePairs` (the assembly the app renders) and the
 * inter-session step replays `useExerciseCompletion` - the same
 * `calculateMaxStrengthAdjustment` call, followed by the field guards
 * `exerciseProgressStore.updateExercise` applies. Nothing is recomputed here,
 * so the harness cannot drift into a progression production never produces.
 *
 * Out of scope: branch level changes. Production hands `levelUp`/`levelDown` to
 * `updateBranchLevel`, which can swap the exercise for a harder or easier one.
 * The harness stays on a single exercise and records the flags instead, so any
 * session following a flagged one no longer mirrors the app.
 */
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { ExerciseDifficultyType } from "@/constants/workoutConstants";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
import { WARMUP_WEIGHT_PERCENTAGES } from "@/features/training/generators/warmupDerivation";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
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
import type { FeedbackScript } from "./feedbackScripts";
import {
  personaGenderTag,
  personaToUser,
  type LegacyPersona,
} from "./personaAdapter";

/** Stand-in branch for the single exercise under simulation. */
const SIMULATED_BRANCH_ID = "progression-simulator-branch";

/** Ignored by the MAX branch, which sizes the set count from the user level. */
const SETS_PER_EXERCISE = 3;

export interface SetSnapshot {
  setNumber: number;
  isWarmup: boolean;
  /**
   * Working sets: percent of F-Max. Warm-ups: the nominal percentage of the 1st
   * working set from `WARMUP_WEIGHT_PERCENTAGES`; the applied load is floored in
   * percentage space (see `computeWarmupTrainingWeights`), so `weightKg` is not
   * exactly this fraction of the 1st working set's displayed weight.
   */
  percentage: number | null;
  weightKg: number;
  reps: number;
  /** Seconds between this set and the next set of the same exercise, support work included. */
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
  /**
   * Branch level change requested by the adjustment. Production would swap the
   * exercise here, which the harness does not model.
   */
  levelUp: boolean;
  levelDown: boolean;
}

export interface SessionSnapshot {
  session: number;
  focus: SkillCode;
  exercises: ExerciseSnapshot[];
}

export interface SimulateOptions {
  sessions: number;
  feedback: FeedbackScript;
  /**
   * Exercise pool handed to the generator. Must contain the exercise under test
   * plus SUPPORT exercises that clear the equipment filter, since production
   * fills the gaps between working sets with them. Mixing timed and rep-based
   * support exercises makes `pauseSeconds` depend on the generator's random
   * pick, so keep the pool uniform for stable goldens.
   */
  exercises: ExerciseType[];
  /** Absolute strength values so percentages resolve to realistic kg. */
  maxValues?: MaxValuesType;
  place?: string;
  equipment?: string[];
}

/**
 * Mirrors the field guards of `exerciseProgressStore.updateExercise`, so the
 * state carried into the next session is what the store would hold.
 */
function applyExerciseUpdate(
  existing: UserExerciseDataType | undefined,
  data: Partial<UserExerciseDataType> &
    Pick<UserExerciseDataType, "exerciseId" | "skill">,
): UserExerciseDataType {
  const next: UserExerciseDataType = {
    ...existing,
    exerciseId: data.exerciseId,
    skill: data.skill,
  };
  if (data.feedback) {
    const previousDifficulty = existing?.feedback?.difficulty;
    next.feedback = {
      difficulty: data.feedback.difficulty,
      streakCounter:
        previousDifficulty && previousDifficulty === data.feedback.difficulty
          ? (existing?.feedback?.streakCounter ?? 0) + 1
          : 1,
    };
  }
  if (data.maxFLevelAdjustment) {
    next.maxFLevelAdjustment = data.maxFLevelAdjustment;
  }
  if (data.maxFRepetitions) {
    next.maxFRepetitions = data.maxFRepetitions;
  }
  if (typeof data.nextWeightPercentage === "number") {
    next.nextWeightPercentage = data.nextWeightPercentage;
  }
  if (typeof data.weight === "number") {
    next.weight = data.weight;
  }
  return next;
}

/**
 * Turns the generated set list into per-set snapshots. Pause entries and
 * support exercises are not recorded as sets; their duration is folded into the
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
  const warmupCount = WARMUP_WEIGHT_PERCENTAGES.length;

  return mainIndices.map((entryIndex, setIndex) => {
    const entry = setList[entryIndex];
    const nextEntryIndex = mainIndices[setIndex + 1] ?? setList.length;
    const isWarmup = setIndex < warmupCount;
    return {
      setNumber: setIndex + 1,
      isWarmup,
      percentage:
        (isWarmup
          ? WARMUP_WEIGHT_PERCENTAGES[setIndex]
          : workingPercentages[setIndex - warmupCount]) ?? null,
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

  let userExercisesData: Record<string, UserExerciseDataType | undefined> = {};
  const sessions: SessionSnapshot[] = [];

  for (let session = 1; session <= opts.sessions; session++) {
    const previous = userExercisesData[exercise.id];
    const weightPercentageBefore = previous?.nextWeightPercentage ?? null;

    const setList = generator.getSetListFromExercisePairs(
      [
        {
          first: {
            branchId: SIMULATED_BRANCH_ID,
            branchTags: [],
            exerciseId: exercise.id,
          },
        },
      ],
      { skill: focus, length: 0 },
      {},
      user,
      opts.place ?? "HOME",
      opts.equipment ?? [],
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

    // What the screen reads: the exercise's last entry in the training list,
    // converted the way the generator output is converted for the store.
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
          levelUp: adjustment.levelUp,
          levelDown: adjustment.levelDown,
        },
      ],
    });

    // Same write order as the screen: the reported feedback is persisted first,
    // an override replaces it, and the closing update writes no feedback at all.
    let stored = applyExerciseUpdate(previous, {
      exerciseId: exercise.id,
      skill: focus,
      feedback: { difficulty: feedbackGiven },
    });
    if (adjustment.feedbackOverride) {
      stored = applyExerciseUpdate(stored, {
        exerciseId: exercise.id,
        skill: focus,
        feedback: adjustment.feedbackOverride,
      });
    }
    userExercisesData = {
      ...userExercisesData,
      [exercise.id]: applyExerciseUpdate(stored, {
        exerciseId: exercise.id,
        skill: focus,
        weight: lastEntry?.weight,
        nextWeightPercentage: adjustment.nextWeightPercentage,
        maxFRepetitions: adjustment.maxFRepetitions,
        maxFLevelAdjustment: feedbackGiven,
      }),
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
