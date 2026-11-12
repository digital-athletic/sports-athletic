import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { getExerciseById } from "@/data/exerciseRegistry";
import { type MaxValuesType } from "@/features/training/models/MaxValues";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  type ChecklistEntryGroup,
  findFirstOpenSetIndex,
  groupChecklistEntries,
} from "@/features/training/utils/checklistEntries";
import {
  isEnduranceSkill,
  isFeedbackEligibleSkill,
} from "@/features/training/utils/exerciseDataUtils";
import { getExercisePictureSource } from "@/features/training/utils/exercisePicture";
import {
  heartRateBySkillAndBirthday,
  type HeartRateInterval,
} from "@/features/training/utils/heartRateUtils";
import {
  deriveRowReps,
  deriveSetWeight,
  deriveSteadyRunDuration,
} from "@/features/training/utils/checklistSetTargets";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { formatPlannedMinutes } from "@/utils/date";
import { getTagValues } from "@/utils/tagUtils";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";

/** Target load in kilos; isPerHand marks dumbbell exercises (one weight per hand). */
export type RowWeight = { kilos: number; isPerHand: boolean };

export type ListRow = {
  index: number;
  exerciseId: string;
  displayName: string;
  pictureUrl: string | null;
  valueKind: ValueKind | null;
  /** Set number only, e.g. "2 of 3"; reps and weight are shown as tiles. */
  setLabel?: string;
  nextSetLabel?: string;
  targetReps?: number;
  targetWeight?: RowWeight;
  /** Planned duration of a steady run in seconds. */
  targetDuration?: number;
  /** Heart rate band of a steady run's cardio zone. */
  heartRateBand?: HeartRateInterval;
  isTest: boolean;
  isLastInSet: boolean;
  isFeedbackSkill: boolean;
  completed: boolean;
};

export type ChecklistSetSummary = {
  index: number;
  label: string | undefined;
  completed: boolean;
  skipped: boolean;
};

/** The main value of an exercise, which its placeholder icon tells. */
export type ValueKind = "weight" | "time" | "reps";

export type ChecklistEntry = {
  key: number;
  exerciseId: string;
  displayName: string;
  pictureUrl: string | null;
  valueKind: ValueKind | null;
  isTest: boolean;
  sets: ChecklistSetSummary[];
  completed: boolean;
  skippedCount: number;
  firstOpenSetIndex: number | null;
};

export type ChecklistEntryBlock = {
  key: number;
  /** Skill of the block's first exercise. */
  skill: string;
  isSuperset: boolean;
  entries: ChecklistEntry[];
};

function deriveRowWeight(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
): RowWeight | undefined {
  const kilos = deriveSetWeight(exercise, exerciseData, maxValues);
  if (kilos === undefined || !exerciseData) return undefined;

  const isPerHand = getTagValues(
    exerciseData.tags,
    TagGroups.EQUIPMENT,
  ).includes(WorkoutConstants.EQUIPMENT.DUMBBELL);
  return { kilos, isPerHand };
}

const joinParts = (parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(" · ") || undefined;

/**
 * Labels of a row: setLabel (set number) for the sheet subtitle, and the full
 * nextSetLabel for the rest screen preview, which adds a timed set's duration.
 */
function buildSetLabels(
  exercise: UserExerciseDataType,
  reps: number | undefined,
  weight: RowWeight | undefined,
  t: TFunction,
) {
  const setPart =
    exercise.set && exercise.set[1] > 1
      ? t("training.active.set", {
          current: exercise.set[0],
          total: exercise.set[1],
        })
      : undefined;

  const repsPart =
    reps !== undefined
      ? t("training.overview.repetitions", { count: reps })
      : undefined;

  const steadyRunDuration = deriveSteadyRunDuration(exercise);
  const steadyRunPart =
    steadyRunDuration === undefined
      ? undefined
      : t("training.list.setMinutes", {
          minutes: formatPlannedMinutes(steadyRunDuration),
        });

  const durationPart = exercise.duration
    ? t("training.overview.seconds", { count: exercise.duration })
    : undefined;

  const weightPart = weight
    ? `${weight.isPerHand ? t("training.active.2x") : ""}${t(
        "training.overview.kilos",
        { weight: weight.kilos.toFixed(2) },
      )}`
    : undefined;

  return {
    setLabel: setPart,
    nextSetLabel: joinParts([
      setPart,
      steadyRunPart ?? repsPart ?? durationPart,
      weightPart,
    ]),
  };
}

/** inMinutes marks the planned duration of a steady run. */
type SetValue = { kind: ValueKind; amount: number; inMinutes?: boolean };

/**
 * The main value of a set: the weight, else the duration of a timed set or a
 * steady run, else the repetitions. A strength test has none.
 */
function deriveSetValue(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
): SetValue | undefined {
  const weight = deriveSetWeight(exercise, exerciseData, maxValues);
  if (weight !== undefined) return { kind: "weight", amount: weight };
  if (typeof exercise.duration === "number" && exercise.duration > 0) {
    return {
      kind: "time",
      amount: exercise.duration,
      inMinutes: isEnduranceSkill(exercise.skill),
    };
  }
  if (typeof exercise.repetition === "number" && exercise.repetition > 0) {
    return { kind: "reps", amount: exercise.repetition };
  }
  return undefined;
}

function deriveSetValueKind(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
): ValueKind | null {
  return deriveSetValue(exercise, exerciseData, maxValues)?.kind ?? null;
}

function buildSetSummaryLabel(
  value: SetValue | undefined,
  t: TFunction,
): string | undefined {
  switch (value?.kind) {
    case "weight":
      return t("training.list.setKilos", {
        weight: Number(value.amount.toFixed(2)),
      });
    case "time":
      return value.inMinutes
        ? t("training.list.setMinutes", {
            minutes: formatPlannedMinutes(value.amount),
          })
        : t("training.list.setSeconds", { count: value.amount });
    case "reps":
      return t("training.list.setReps", { count: value.amount });
    default:
      return undefined;
  }
}

type EntryContext = {
  exerciseList: UserExerciseDataType[];
  rowsByIndex: Map<number, ListRow>;
  maxValues: MaxValuesType;
  t: TFunction;
};

function buildEntry(
  group: ChecklistEntryGroup,
  { exerciseList, rowsByIndex, maxValues, t }: EntryContext,
): ChecklistEntry {
  const exerciseData = getExerciseById(group.exerciseId);
  const values = group.setIndices.map((index) =>
    deriveSetValue(exerciseList[index], exerciseData, maxValues),
  );
  const sets = group.setIndices.map((index, position) => ({
    index,
    label: buildSetSummaryLabel(values[position], t),
    completed: Boolean(exerciseList[index].completed),
    skipped: Boolean(exerciseList[index].skipped),
  }));
  const firstRow = rowsByIndex.get(group.key);
  return {
    key: group.key,
    exerciseId: group.exerciseId,
    displayName: firstRow?.displayName ?? group.exerciseId,
    pictureUrl: firstRow?.pictureUrl ?? null,
    valueKind: firstRow?.valueKind ?? null,
    isTest: firstRow?.isTest ?? false,
    sets,
    completed: sets.every((set) => set.completed),
    skippedCount: sets.filter((set) => set.skipped).length,
    firstOpenSetIndex: findFirstOpenSetIndex(exerciseList, group.setIndices),
  };
}

function buildEntryBlocks(
  exerciseList: UserExerciseDataType[],
  rows: ListRow[],
  maxValues: MaxValuesType,
  t: TFunction,
): ChecklistEntryBlock[] {
  const context: EntryContext = {
    exerciseList,
    rowsByIndex: new Map(rows.map((row) => [row.index, row])),
    maxValues,
    t,
  };

  return groupChecklistEntries(exerciseList).map((block) => {
    const entries = block.entries.map((group) => buildEntry(group, context));

    const key = block.entries[0].key;
    return {
      key,
      skill: exerciseList[key].skill,
      isSuperset: block.isSuperset,
      entries,
    };
  });
}

/** Builds the visible checklist rows (pause exercises excluded) for the list view. */
export function useTrainingListRows() {
  const { t } = useTranslation();
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const activeTraining = useTrainingStore((s) => s.activeTraining);
  const maxValues = useUserWorkoutStore((s) => s.workoutData.maxValues);
  const birthday = useUserProfileStore((s) => s.personalData.birthday);

  const rows = (exerciseList ?? []).reduce<ListRow[]>(
    (acc, exercise, index) => {
      if (checkIsPauseExercise(exercise.exerciseId)) return acc;

      const exerciseData = getExerciseById(exercise.exerciseId);
      const targetReps = deriveRowReps(exercise);
      const targetWeight = deriveRowWeight(exercise, exerciseData, maxValues);
      const targetDuration = deriveSteadyRunDuration(exercise);

      acc.push({
        index,
        exerciseId: exercise.exerciseId,
        displayName:
          exerciseData?.displayName ??
          exerciseData?.name ??
          exercise.exerciseId,
        pictureUrl: getExercisePictureSource(exerciseData?.picture),
        valueKind: deriveSetValueKind(exercise, exerciseData, maxValues),
        ...buildSetLabels(exercise, targetReps, targetWeight, t),
        targetReps,
        targetWeight,
        targetDuration,
        heartRateBand:
          targetDuration === undefined
            ? undefined
            : heartRateBySkillAndBirthday(exercise.skill, birthday),
        isTest: exercise.repetition === -1,
        isLastInSet: exercise.set?.[0] === exercise.set?.[1],
        isFeedbackSkill: isFeedbackEligibleSkill(
          activeTraining,
          exercise.skill,
        ),
        completed: Boolean(exercise.completed),
      });
      return acc;
    },
    [],
  );

  // The athlete still taps the finish button, unlike in the step-by-step view.
  const allCompleted = rows.length > 0 && rows.every((row) => row.completed);
  const completedCount = rows.filter((row) => row.completed).length;
  const progress = rows.length > 0 ? completedCount / rows.length : 0;
  const blocks = buildEntryBlocks(exerciseList ?? [], rows, maxValues, t);

  return { rows, blocks, allCompleted, progress };
}
