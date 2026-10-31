import { WorkoutConstants } from "@/constants/workoutConstants";
import { SeasonPhase } from "@/features/training/models/SeasonPhase";
import { minutes } from "@/features/training/models/TimeUnits";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { UserType } from "@/schemas/user.schema";
import type { PlacesData } from "@/store/placesStore";

/**
 * Builds an adult field player in the preparatory season phase who trains on
 * Monday and Wednesday in a studio for 60 minutes, with the places of the
 * studio, as the plan generator takes them.
 *
 * generateStudioPlanInputs()
 * → { user: { userId: "plan-user", ... }, userTrainingDays: [{ weekday: 1, active: true, place: "STUDIO", ... }, ...], places: { STUDIO: { equipment: ["BARBELL", ...] } } }
 */
export const generateStudioPlanInputs = (): {
  user: UserType;
  userTrainingDays: TrainingDayType[];
  places: PlacesData;
} => {
  const studioEquipment = ["BARBELL", "DUMBBELL", "BENCH", "MAT"];
  return {
    user: {
      userId: "plan-user",
      personalData: { gender: "MALE", birthday: "1990-01-01" },
      workoutData: {
        tags: {
          LEVEL: [WorkoutConstants.LEVELS.ADVANCED],
          POSITION: ["FIELD"],
        },
        seasonPhase: {
          type: SeasonPhase.PREPARATORY,
          numOfWeeks: 14,
          endDate: "2026-04-20",
        },
      },
    },
    userTrainingDays: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      active: weekday === 1 || weekday === 3,
      weekday,
      duration: minutes(60),
      place: "STUDIO",
    })),
    places: { STUDIO: { equipment: studioEquipment } } as PlacesData,
  };
};

/** The minutes of each training day of `generateProfessionalKneePainPlanInputs`. */
const PROFESSIONAL_KNEE_PAIN_TRAINING_MINUTES = 75;

/**
 * Builds the plan generator inputs of a professional field player with left
 * knee pain in the preparatory season phase. The player trains in a studio on
 * Monday, Wednesday and Friday for `PROFESSIONAL_KNEE_PAIN_TRAINING_MINUTES`
 * each.
 *
 * generateProfessionalKneePainPlanInputs()
 * → { user: { workoutData: { tags: { LEVEL: ["PROFESSIONAL"], PAIN: ["KNEE_LEFT"], ... } } }, userTrainingDays: [{ weekday: 1, duration: 75, ... }, ...], places: { STUDIO: ... } }
 */
export const generateProfessionalKneePainPlanInputs = (): {
  user: UserType;
  userTrainingDays: TrainingDayType[];
  places: PlacesData;
} => {
  const { user, places } = generateStudioPlanInputs();
  return {
    user: {
      ...user,
      workoutData: {
        ...user.workoutData,
        tags: {
          LEVEL: [WorkoutConstants.LEVELS.PROFESSIONAL],
          POSITION: ["FIELD"],
          PAIN: ["KNEE_LEFT"],
        },
      },
    },
    userTrainingDays: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      active: weekday === 1 || weekday === 3 || weekday === 5,
      weekday,
      duration: minutes(PROFESSIONAL_KNEE_PAIN_TRAINING_MINUTES),
      place: "STUDIO",
    })),
    places,
  };
};
