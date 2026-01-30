import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { ISODateToDate } from "@/utils/date";
import { isTagInGroup } from "@/utils/tagUtils";
import { isPauseExercise } from "./models/IdTypes";
import { TrainingSectionType } from "./models/TrainingSection";
import type { UserExerciseDataType } from "./models/UserExerciseData";

const EQUIPMENT_TAG_PREFIX = "EQ_";

// Helper predicates
const includesBench = (item: string): boolean => item.includes("BENCH");
const includesMedicineBall = (item: string): boolean =>
  item.includes("MEDICINE_BALL");
const isEquipmentTag = (tag: string): boolean =>
  isTagInGroup(tag, TagGroups.EQUIPMENT);
const extractEquipmentName = (tag: string): string =>
  tag.substring(EQUIPMENT_TAG_PREFIX.length);

// Checks if equipment list contains barbell types
const hasBarbell = (equipment: string[]): boolean =>
  equipment.includes(WorkoutConstants.EQUIPMENT.BARBELL) ||
  equipment.includes(WorkoutConstants.EQUIPMENT.BARBELL_MULTIPLE);

const hasDumbbell = (equipment: string[]): boolean =>
  equipment.includes(WorkoutConstants.EQUIPMENT.DUMBBELL);

// Processes benches for studio location
const getStudioBenches = (equipment: string[]): string[] => {
  const benches: string[] = [];

  if (hasDumbbell(equipment)) {
    benches.push(WorkoutConstants.EQUIPMENT.ADJUSTABLE_BENCH);
  }

  if (hasBarbell(equipment)) {
    benches.push(WorkoutConstants.EQUIPMENT.BARBELL_BENCH);
  } else {
    benches.push(WorkoutConstants.EQUIPMENT.BENCH);
  }

  return benches;
};

// Processes benches based on place
const processBenches = (equipment: string[], place: string): string[] => {
  const hasBenches = equipment.some(includesBench);
  if (!hasBenches) return [];

  return place === "STUDIO"
    ? getStudioBenches(equipment)
    : [WorkoutConstants.EQUIPMENT.BENCH];
};

// Consolidates medicine balls into single item if multiple
const processMedicineBalls = (equipment: string[]): string[] => {
  const medicineBalls = equipment.filter(includesMedicineBall);

  if (medicineBalls.length === 0) return [];
  if (medicineBalls.length === 1) return medicineBalls;
  return [WorkoutConstants.EQUIPMENT.MEDICINE_BALL];
};

// Filters out benches and medicine balls from equipment
const getOtherEquipment = (equipment: string[]): string[] =>
  equipment.filter(
    (item) => !includesBench(item) && !includesMedicineBall(item),
  );

/**
 * Returns processed equipment list based on training place.
 * Consolidates bench types and medicine balls based on location.
 */
export const getEquipmentForPlace = (
  equipment: string[],
  place: string,
): string[] => [
  ...processBenches(equipment, place),
  ...processMedicineBalls(equipment),
  ...getOtherEquipment(equipment),
];

// Extracts equipment tags from an exercise
const extractExerciseEquipment = (exercise: ExerciseType): string[] =>
  exercise.tags.filter(isEquipmentTag).map(extractEquipmentName);

// Collects unique equipment from exercises matching the given IDs
const collectEquipmentFromExercises = (
  exercises: ExerciseType[],
  usedExerciseIds: Set<string>,
): string[] => {
  const allEquipment = exercises
    .filter((exercise) => usedExerciseIds.has(exercise.id))
    .flatMap(extractExerciseEquipment);

  return [...new Set(allEquipment)];
};

// Extracts unique exercise IDs excluding pause exercises
const getUsedExerciseIds = (
  exerciseList: UserExerciseDataType[],
): Set<string> =>
  new Set(
    exerciseList
      .filter((userExercise) => !isPauseExercise(userExercise.exerciseId))
      .map((userExercise) => userExercise.exerciseId),
  );

/**
 * Collects equipment from exercise list and applies place-based processing.
 * Filters out pause exercises and returns unique equipment.
 */
export const getEquipmentList = (
  exerciseList: UserExerciseDataType[],
  exercises: ExerciseType[],
  place: string,
): string[] => {
  const usedExerciseIds = getUsedExerciseIds(exerciseList);
  const equipment = collectEquipmentFromExercises(exercises, usedExerciseIds);
  const processedEquipment = getEquipmentForPlace(equipment, place);
  return [...new Set(processedEquipment)];
};

// Converts section start date to timestamp
const getSectionTimestamp = (section: TrainingSectionType): number =>
  ISODateToDate(section.start).getTime();

// Finds section with latest start time
const findLatestSection = (
  sections: TrainingSectionType[],
): TrainingSectionType =>
  sections.reduce((latest, current) =>
    getSectionTimestamp(current) > getSectionTimestamp(latest)
      ? current
      : latest,
  );

export const getSectionForDate = (
  sections: TrainingSectionType[],
  timestamp: number,
): TrainingSectionType => {
  const sectionsNotInFuture = sections.filter(
    (section) => getSectionTimestamp(section) <= timestamp,
  );

  return sectionsNotInFuture.length > 0
    ? findLatestSection(sectionsNotInFuture)
    : sections[0];
};
