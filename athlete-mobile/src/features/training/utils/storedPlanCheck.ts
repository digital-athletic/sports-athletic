import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { UserTrainingType } from "@/features/training/models/UserTraining";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import { equipmentForExerciseExists } from "@/features/training/utils/equipmentUtils";
import { getUserExerciseFromBranch } from "@/features/training/utils/skillTreeUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { BranchDataMapType } from "@/store/exerciseProgressStore";
import type { PlacesData } from "@/store/placesStore";
import { isISODate } from "@/utils/date";
import { getTagValues } from "@/utils/tagUtils";

export interface StoredPlanCheckInput {
  plan: TrainingPlanType;
  birthday: string;
  userLevel: string;
  trainingDays: TrainingDayType[];
  places: PlacesData;
  exercises: ExerciseType[];
  branchData: BranchDataMapType;
}

const MAX_STRENGTH_SKILLS = ["MAX", "MAX_STRENGTH"];

const isAdultOnly = (branch: ExerciseBranchType): boolean => {
  const ageTags = getTagValues(branch.tags, TagGroups.AGE);
  return (
    ageTags.length > 0 && !ageTags.includes(WorkoutConstants.AGE_GROUPS.CHILD)
  );
};

/**
 * True when a stored plan holds what older plan creation let through and no
 * workout corrects: an adult-only branch for a child with a known birthday,
 * or a max strength lift whose equipment the day's place lacks.
 */
export function isStoredPlanBroken(input: StoredPlanCheckInput): boolean {
  // a missing birthday is not a known age, so it never counts as a child here
  const isChild =
    isISODate(input.birthday) &&
    ageGroupFor(input.birthday) === WorkoutConstants.AGE_GROUPS.CHILD;

  const liftLacksEquipment = (
    branch: ExerciseBranchType,
    equipment: string[],
  ): boolean => {
    const exercise = getUserExerciseFromBranch(
      { tags: branch.tags, levels: branch.exercises },
      input.userLevel,
      input.exercises,
      input.branchData[branch.branchId] ?? null,
    );
    return (
      exercise !== null && !equipmentForExerciseExists(exercise, equipment)
    );
  };

  const isTrainingBroken = (training: UserTrainingType): boolean => {
    const place = input.trainingDays.find(
      (day) => day.weekday === training.weekday,
    )?.place;
    const equipment = place ? input.places[place]?.equipment : undefined;
    const isBranchBroken = (skill: string, branch: ExerciseBranchType) =>
      (isChild && isAdultOnly(branch)) ||
      (equipment !== undefined &&
        MAX_STRENGTH_SKILLS.includes(skill) &&
        liftLacksEquipment(branch, equipment));
    return Object.entries(training.skills).some(([skill, branches]) =>
      (branches ?? []).some((branch) => isBranchBroken(skill, branch)),
    );
  };

  return input.plan.sections.some((section) =>
    section.trainings.some(isTrainingBroken),
  );
}
