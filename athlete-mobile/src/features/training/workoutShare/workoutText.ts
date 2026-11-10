import { WorkoutConstants } from "@/constants/workoutConstants";
import { type MaxValuesType } from "@/features/training/models/MaxValues";
import { getEquipmentList } from "@/features/training/trainingUtils";
import {
  type ChecklistBlock,
  type ChecklistEntryGroup,
  groupChecklistEntries,
} from "@/features/training/utils/checklistEntries";
import { deriveSetWeight } from "@/features/training/utils/checklistSetTargets";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { type TFunction } from "i18next";

export type WorkoutTextSource = {
  exerciseList: UserExerciseDataType[];
  exercises: ExerciseType[];
  place: string;
  maxValues: MaxValuesType;
  date: string;
};

const INDENT = "   ";

const translateEquipment = (equipment: string[], t: TFunction): string[] =>
  equipment
    .map(
      (key) =>
        WorkoutConstants.EQUIPMENT[
          key as keyof typeof WorkoutConstants.EQUIPMENT
        ] ?? key,
    )
    .map((name) => t(`equipment.items.${name}`))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

const describeSet = (
  exercise: UserExerciseDataType,
  exerciseData: ExerciseType,
  maxValues: MaxValuesType,
  t: TFunction,
): string => {
  const weight = deriveSetWeight(exercise, exerciseData, maxValues);
  const amount =
    exercise.repetition === undefined
      ? t("training.overview.seconds", { count: exercise.duration })
      : exercise.repetition === -1
        ? t("training.overview.numberMax")
        : t("training.overview.repetitions", { count: exercise.repetition });
  return [
    amount,
    weight === undefined
      ? undefined
      : t("training.overview.kilos", { weight: weight.toFixed(2) }),
    exercise.height
      ? t("training.overview.cmHigh", { height: exercise.height })
      : undefined,
  ]
    .filter((part) => part !== undefined)
    .join(", ");
};

// Sets with changing weight or repetitions get one line each, so none is lost.
const entryLines = (
  entry: ChecklistEntryGroup,
  { exerciseList, exercises, maxValues }: WorkoutTextSource,
  t: TFunction,
): string[] => {
  const exerciseData = exercises.find((e) => e.id === entry.exerciseId);
  if (!exerciseData) return [];
  const name = exerciseData.displayName ?? exerciseData.name;
  const sets = entry.setIndices.map((index) =>
    describeSet(exerciseList[index], exerciseData, maxValues, t),
  );
  if (new Set(sets).size === 1) return [`${name}: ${sets[0]}`];
  return [
    name,
    ...sets.map(
      (set, position) =>
        `${INDENT}${t("training.list.share.setNumber", { number: position + 1 })}: ${set}`,
    ),
  ];
};

// A superset lists its exercises under one set count.
const blockLines = (
  block: ChecklistBlock,
  source: WorkoutTextSource,
  t: TFunction,
): string[] => {
  const exercises = block.entries.flatMap((entry) =>
    entryLines(entry, source, t),
  );
  if (exercises.length === 0) return [];
  const setCount = block.entries[0].setIndices.length;
  return [
    setCount === 1
      ? t("training.overview.oneSet")
      : t("training.overview.setCount", { count: setCount }),
    ...exercises,
  ];
};

/** Plain text of the workout that reads well when pasted into a notes app. */
export const buildWorkoutText = (
  source: WorkoutTextSource,
  t: TFunction,
): string => {
  const { exerciseList, exercises, place, date } = source;
  const sections: string[][] = [[`${t("training.list.share.title")} ${date}`]];

  const equipment = translateEquipment(
    getEquipmentList(exerciseList, exercises, place),
    t,
  );
  if (equipment.length > 0) {
    sections.push([
      t("training.overview.equipmentNeeded"),
      ...equipment.map((item) => `• ${item}`),
    ]);
  }

  let previousSkill: string | undefined;
  for (const block of groupChecklistEntries(exerciseList)) {
    const lines = blockLines(block, source, t);
    if (lines.length === 0) continue;
    const { skill } = exerciseList[block.entries[0].key];
    const section = sections.at(-1);
    if (skill === previousSkill && section) {
      section.push(...lines);
    } else {
      sections.push([
        t(`training.skill.${skill}`, { defaultValue: skill }),
        ...lines,
      ]);
      previousSkill = skill;
    }
  }

  return sections.map((lines) => lines.join("\n")).join("\n\n");
};
