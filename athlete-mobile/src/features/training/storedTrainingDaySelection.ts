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

/** A stored training day with the plan section and weekday it came from. */
export interface LocatedTrainingDay {
  day: StoredTrainingDay;
  sectionIndex: number;
  weekday: number;
}

/**
 * Locates the stored training day of a weekday in the athlete's plan, as the
 * old generator does: the given section or the section of today, extended for
 * missed weeks, then the weekday's training or the section's first one.
 *
 * locateStoredTrainingDay(user, 3, undefined, 0)
 * → { day: { skills: { WU: [...] }, lengths: { WU: 5 } }, sectionIndex: 0, weekday: 1 }
 */
export const locateStoredTrainingDay = (
  user: UserType,
  weekday: number,
  givenSection: number | undefined,
  daysSinceLastWorkout: number,
): LocatedTrainingDay => {
  requireWorkoutData(user);
  const trainingPlan = requireTrainingPlan(user);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Extension shifts the starts only, so indexes match the stored plan.
  const sections =
    daysSinceLastWorkout > MIN_DAYS_TO_EXTEND &&
    daysSinceLastWorkout <= MAX_DAYS_TO_EXTEND
      ? extendSectionsForMissedWeeks(
          trainingPlan.sections,
          daysSinceLastWorkout,
        ).sections
      : trainingPlan.sections;

  // A given section 0 reads as no section, as in the old generator.
  const sectionIndex = givenSection
    ? givenSection
    : sections.indexOf(
        getSectionForDate(
          sections as Parameters<typeof getSectionForDate>[0],
          today.getTime(),
        ),
      );

  // The schema types skills loosely; the model names each skill key.
  const trainings = sections[sectionIndex].trainings as UserTrainingType[];
  const training =
    trainings.find((entry) => entry.weekday === weekday) ?? trainings[0];

  return {
    day: {
      skills: cloneWithValidation(
        training.skills,
        SkillBranchesSchema,
        "currTraining.skills",
      ),
      lengths: { ...training.lengths },
    },
    sectionIndex,
    weekday: training.weekday,
  };
};

/**
 * Selects the stored training day of a weekday from the athlete's plan; see
 * locateStoredTrainingDay.
 *
 * selectStoredTrainingDay(user, 1, undefined, 0)
 * → { skills: { WU: [{ branchId: "410", ... }] }, lengths: { WU: 5 } }
 */
export const selectStoredTrainingDay = (
  user: UserType,
  weekday: number,
  givenSection: number | undefined,
  daysSinceLastWorkout: number,
): StoredTrainingDay =>
  locateStoredTrainingDay(user, weekday, givenSection, daysSinceLastWorkout)
    .day;
