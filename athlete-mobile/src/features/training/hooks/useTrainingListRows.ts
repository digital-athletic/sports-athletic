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
import { deriveEntryWeight } from "@/features/training/utils/workoutUtils";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { getTagValues } from "@/utils/tagUtils";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";

export type ListRow = {
  index: number;
  exerciseId: string;
  displayName: string;
  setLabel?: string;
  nextSetLabel?: string;
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

export type ChecklistEntry = {
  key: number;
  exerciseId: string;
  displayName: string;
  isTest: boolean;
  sets: ChecklistSetSummary[];
  completed: boolean;
  firstOpenSetIndex: number | null;
};

export type ChecklistEntryBlock = {
  key: number;
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

/** Target weight for the row, e.g. "20.00 kg" or "each 20.00 kg" for dumbbell exercises. */
function buildWeightPart(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
  t: TFunction,
): string | undefined {
  const derivedWeight = deriveSetWeight(exercise, exerciseData, maxValues);
  if (derivedWeight === undefined || !exerciseData) return undefined;

  const isDumbbellExercise = getTagValues(
    exerciseData.tags,
    TagGroups.EQUIPMENT,
  ).includes(WorkoutConstants.EQUIPMENT.DUMBBELL);
  const kilos = t("training.overview.kilos", {
    weight: derivedWeight.toFixed(2),
  });
  return isDumbbellExercise ? `${t("training.active.2x")}${kilos}` : kilos;
}

const joinParts = (parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(" · ") || undefined;

/**
 * Labels of a row: setLabel for the row itself, nextSetLabel for the rest
 * screen preview, which adds the duration of a timed set.
 */
function buildSetLabels(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
  t: TFunction,
) {
  const setPart =
    exercise.set && exercise.set[1] > 1
      ? t("training.active.set", {
          current: exercise.set[0],
          total: exercise.set[1],
        })
      : undefined;

  // Strength tests mark reps as -1, which this check also excludes.
  const repsPart =
    typeof exercise.repetition === "number" && exercise.repetition > 0
      ? t("training.overview.repetitions", { count: exercise.repetition })
      : undefined;

  const durationPart = exercise.duration
    ? t("training.overview.seconds", { count: exercise.duration })
    : undefined;

  const weightPart = buildWeightPart(exercise, exerciseData, maxValues, t);

  return {
    setLabel: joinParts([setPart, repsPart, weightPart]),
    nextSetLabel: joinParts([setPart, repsPart ?? durationPart, weightPart]),
  };
}

/**
 * The main value of a set for the entry summary: the weight, else the
 * duration of a timed set, else the repetitions. A strength test gets none.
 */
function buildSetSummaryLabel(
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType | undefined,
  maxValues: MaxValuesType,
  t: TFunction,
): string | undefined {
  const weight = deriveSetWeight(exercise, exerciseData, maxValues);
  if (weight !== undefined) {
    return t("training.list.setKilos", { weight: Number(weight.toFixed(2)) });
  }
  if (
    typeof exercise.duration === "number" &&
    exercise.duration > 0 &&
    !isEnduranceSkill(exercise.skill)
  ) {
    return t("training.list.setSeconds", { count: exercise.duration });
  }
  if (typeof exercise.repetition === "number" && exercise.repetition > 0) {
    return t("training.list.setReps", { count: exercise.repetition });
  }
  return undefined;
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
  const sets = group.setIndices.map((index) => ({
    index,
    label: buildSetSummaryLabel(exerciseList[index], exerciseData, maxValues, t),
    completed: Boolean(exerciseList[index].completed),
  }));
  const firstRow = rowsByIndex.get(group.key);
  return {
    key: group.key,
    exerciseId: group.exerciseId,
    displayName: firstRow?.displayName ?? group.exerciseId,
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
      (group) => nextSetIndex !== null && group.setIndices.includes(nextSetIndex),
    );

    return {
      key: block.entries[0].key,
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

      acc.push({
        index,
        exerciseId: exercise.exerciseId,
        displayName:
          exerciseData?.displayName ??
          exerciseData?.name ??
          exercise.exerciseId,
        ...buildSetLabels(exercise, exerciseData, maxValues, t),
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
  const blocks = buildEntryBlocks(exerciseList ?? [], rows, maxValues, t);

  return { rows, blocks, allCompleted };
}
