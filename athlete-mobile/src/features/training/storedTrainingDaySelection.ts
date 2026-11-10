import type { UserTrainingType } from "@/features/training/models/UserTraining";
import { getSectionForDate } from "@/features/training/trainingUtils";
import { extendSectionsForMissedWeeks } from "@/features/training/utils/trainingSectionUtils";
import {
  requireTrainingPlan,
  requireWorkoutData,
} from "@/features/training/utils/userDataUtils";
import { SkillBranchesSchema } from "@/schemas/generator.schema";
import type { UserType } from "@/schemas/user.schema";
import { cloneWithValidation } from "@/utils/cloneWithValidation";
import type { StoredTrainingDay } from "@/features/training/workoutGenerator/storedDayWorkout";

// Past three weeks without training the plan regenerates, so the sections
// extend only between one and three weeks.
const MIN_DAYS_TO_EXTEND = 7;
const MAX_DAYS_TO_EXTEND = 21;

/**
 * Selects the stored training day of a weekday from the athlete's plan, as the
 * old generator does: the given section or the section of today, extended for
 * missed weeks, then the weekday's training or the section's first one.
 *
 * selectStoredTrainingDay(user, 1, undefined, 0)
 * → { skills: { WU: [{ branchId: "410", ... }] }, lengths: { WU: 5 } }
 */
export const selectStoredTrainingDay = (
  user: UserType,
  weekday: number,
  givenSection: number | undefined,
  daysSinceLastWorkout: number,
): StoredTrainingDay => {
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

  return {
    skills: cloneWithValidation(
      training.skills,
      SkillBranchesSchema,
      "currTraining.skills",
    ),
    lengths: { ...training.lengths },
  };
};
