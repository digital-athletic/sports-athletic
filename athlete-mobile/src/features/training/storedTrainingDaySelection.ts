import {
  isLegacyTraining,
  readCopiedBranches,
  type UserTrainingType,
} from "@/features/training/models/UserTraining";
import { getSectionForDate } from "@/features/training/trainingUtils";
import { extendSectionsForMissedWeeks } from "@/features/training/utils/trainingSectionUtils";
import {
  requireTrainingPlan,
  requireWorkoutData,
} from "@/features/training/utils/userDataUtils";
import { TemplateSchema } from "@/schemas/aiwl.schema";
import { SkillBranchesSchema } from "@/schemas/generator.schema";
import type { UserType } from "@/schemas/user.schema";
import { cloneWithValidation } from "@/utils/cloneWithValidation";
import type { TrainingDay } from "@/features/training/workoutGenerator/trainingDayGeneration";

// Past three weeks without training the plan regenerates, so the sections
// extend only between one and three weeks.
const MIN_DAYS_TO_EXTEND = 7;
const MAX_DAYS_TO_EXTEND = 21;

/**
 * Selects the stored training day of a weekday from the athlete's plan, as the
 * old generator does: the given section or the section of today, extended for
 * missed weeks, then the weekday's training or the section's first one. A legacy
 * training returns its copied branches and minutes, an AIWL training a copy of
 * its workout. Either copy fails on data that breaks its schema.
 *
 * selectStoredTrainingDay(legacyPlanUser, 1, undefined, 0)
 * → { skills: { WU: [{ branchId: "410", ... }] }, lengths: { WU: 5 } }
 *
 * selectStoredTrainingDay(aiwlPlanUser, 1, undefined, 0)
 * → { aiwl: 1, id: "TRAINING_DAY_1", blocks: [{ kind: "branches", ... }], ... }
 */
export const selectStoredTrainingDay = (
  user: UserType,
  weekday: number,
  givenSection: number | undefined,
  daysSinceLastWorkout: number,
): TrainingDay => {
  requireWorkoutData(user);
  const trainingPlan = requireTrainingPlan(user);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sections =
    daysSinceLastWorkout > MIN_DAYS_TO_EXTEND &&
    daysSinceLastWorkout <= MAX_DAYS_TO_EXTEND
      ? extendSectionsForMissedWeeks(
          trainingPlan.sections,
          daysSinceLastWorkout,
        ).sections
      : trainingPlan.sections;

  // A given section 0 reads as no section, as in the old generator.
  const section = givenSection
    ? sections[givenSection]
    : getSectionForDate(
        sections as Parameters<typeof getSectionForDate>[0],
        today.getTime(),
      );

  // The schema types skills loosely; the model names each skill key.
  const trainings = section.trainings as UserTrainingType[];
  const training =
    trainings.find((entry) => entry.weekday === weekday) ?? trainings[0];

  if (!isLegacyTraining(training)) {
    return cloneWithValidation(
      training.workout,
      TemplateSchema,
      "currTraining.workout",
    );
  }

  return {
    skills: cloneWithValidation(
      readCopiedBranches(training),
      SkillBranchesSchema,
      "currTraining.skills",
    ),
    lengths: { ...training.lengths },
  };
};
