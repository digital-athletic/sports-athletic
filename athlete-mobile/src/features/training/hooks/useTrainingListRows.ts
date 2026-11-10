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
import { deriveEntryWeight } from "@/features/training/utils/workoutUtils";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
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
  isTest: boolean;
  isLastInSet: boolean;
  isFeedbackSkill: boolean;
  completed: boolean;
};

export type ChecklistSetSummary = {
  index: number;
  label: string | undefined;
  completed: boolean;
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
  firstOpenSetIndex: number | null;
};

export type ChecklistEntryBlock = {
  key: number;
  /** Skill of the block's first exercise. */
  skill: string;
  isSuperset: boolean;
  entries: ChecklistEntry[];
  nextEntryKey: number | null;
};

/** Target weight of a set in kg, or undefined for a set without weight. */
function deriveSetWeight(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
): number | undefined {
  if (!exercise.weight || !exerciseData) return undefined;

  const derivedWeight = deriveEntryWeight(
    {
      weight: exercise.weight,
      weightType: exercise.weightType,
      skill: exercise.skill,
    },
    exerciseData,
    maxValues,
  );
  return typeof derivedWeight === "number" ? derivedWeight : undefined;
}

// Strength tests mark reps as -1, which this check also excludes.
function deriveRowReps(exercise: UserExerciseDataType): number | undefined {
  return typeof exercise.repetition === "number" && exercise.repetition > 0
    ? exercise.repetition
    : undefined;
}

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
    nextSetLabel: joinParts([setPart, repsPart ?? durationPart, weightPart]),
  };
}

type SetValue = { kind: ValueKind; amount: number };

/**
 * The main value of a set: the weight, else the duration of a timed set, else
 * the repetitions. A strength test has none.
 */
function deriveSetValue(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
): SetValue | undefined {
  const weight = deriveSetWeight(exercise, exerciseData, maxValues);
  if (weight !== undefined) return { kind: "weight", amount: weight };
  if (
    typeof exercise.duration === "number" &&
    exercise.duration > 0 &&
    !isEnduranceSkill(exercise.skill)
  ) {
    return { kind: "time", amount: exercise.duration };
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
      return t("training.list.setSeconds", { count: value.amount });
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

    const blockSetIndices = block.entries
      .flatMap((group) => group.setIndices)
      .sort((a, b) => a - b);
    const nextSetIndex = findFirstOpenSetIndex(exerciseList, blockSetIndices);
    const nextEntry = block.entries.find(
      (group) =>
        nextSetIndex !== null && group.setIndices.includes(nextSetIndex),
    );

    const key = block.entries[0].key;
    return {
      key,
      skill: exerciseList[key].skill,
      isSuperset: block.isSuperset,
      entries,
      nextEntryKey: nextEntry?.key ?? null,
    };
  });
}

/** Builds the visible checklist rows (pause exercises excluded) for the list view. */
export function useTrainingListRows() {
  const { t } = useTranslation();
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const activeTraining = useTrainingStore((s) => s.activeTraining);
  const maxValues = useUserWorkoutStore((s) => s.workoutData.maxValues);

  const rows = (exerciseList ?? []).reduce<ListRow[]>(
    (acc, exercise, index) => {
      if (checkIsPauseExercise(exercise.exerciseId)) return acc;

      const exerciseData = getExerciseById(exercise.exerciseId);
      const targetReps = deriveRowReps(exercise);
      const targetWeight = deriveRowWeight(exercise, exerciseData, maxValues);

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
