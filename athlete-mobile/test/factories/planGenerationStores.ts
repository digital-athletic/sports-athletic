import { minutes } from "@/features/training/models/TimeUnits";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { UserWorkoutDataType } from "@/features/training/models/UserWorkoutData";
import {
  useExerciseProgressStore,
  type BranchDataMapType,
} from "@/store/exerciseProgressStore";
import { usePlacesStore, type PlacesData } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import {
  useUserProfileStore,
  type UserPersonalDataType,
} from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";

export interface PlanGenerationStores {
  personalData: UserPersonalDataType;
  workoutData: UserWorkoutDataType;
  trainingDays: TrainingDayType[];
  places: PlacesData;
  branchData: BranchDataMapType;
}

const generateTrainingDay = (
  weekday: number,
  overrides: Partial<TrainingDayType> = {},
): TrainingDayType => ({
  active: false,
  weekday,
  duration: minutes(30),
  place: "HOME",
  ...overrides,
});

/**
 * Builds the store contents plan creation reads: an adult man at fitness
 * level ADVANCED in the preparatory phase, training on Monday at home and
 * on Thursday in the studio, with one stored branch level.
 *
 * generatePlanGenerationStores()
 * → { personalData: { username: "athlete", gender: "MALE", birthday: "1990-06-15" },
 *     workoutData: { sport: "OTHER_SPORT", tags: { LEVEL: ["ADVANCED"], POSITION: ["FIELD"] },
 *       seasonPhase: { type: "PREPARATORY", endDate: "2027-03-01" }, maxValues: ... },
 *     trainingDays: [Monday HOME 45, ..., Thursday STUDIO 60, ...],
 *     places: { HOME: { equipment: ["DUMBBELL"] }, STUDIO: { equipment: ["BARBELL"] }, ... },
 *     branchData: { "SWR1-1": { branchId: "SWR1-1", level: 3 } } }
 */
export const generatePlanGenerationStores = (): PlanGenerationStores => ({
  personalData: {
    username: "athlete",
    gender: "MALE",
    birthday: "1990-06-15",
  },
  workoutData: {
    sport: "OTHER_SPORT",
    tags: { LEVEL: ["ADVANCED"], POSITION: ["FIELD"] },
    seasonPhase: { type: "PREPARATORY", endDate: "2027-03-01" },
    maxValues: DEFAULT_MAX_VALUES,
  },
  trainingDays: [
    generateTrainingDay(0, { active: true, duration: minutes(45) }),
    generateTrainingDay(1),
    generateTrainingDay(2),
    generateTrainingDay(3, {
      active: true,
      duration: minutes(60),
      place: "STUDIO",
    }),
    generateTrainingDay(4),
    generateTrainingDay(5),
    generateTrainingDay(6),
  ],
  places: {
    HOME: { equipment: ["DUMBBELL"] },
    STUDIO: { equipment: ["BARBELL"] },
    HALL: { equipment: [] },
    OUTSIDE: { equipment: [] },
  },
  branchData: { "SWR1-1": { branchId: "SWR1-1", level: 3 } },
});

/**
 * Writes the store contents into the stores, with one sore muscle in the
 * workout store that plan creation must not read.
 */
export const seedPlanGenerationStores = (
  stores: PlanGenerationStores,
): void => {
  useUserProfileStore.setState({ personalData: stores.personalData });
  useUserWorkoutStore.setState({
    workoutData: stores.workoutData,
    temporalData: [
      { tag: "CHEST", date: "2026-10-24", expiration: "2026-10-25" },
    ],
  });
  useTrainingScheduleStore.setState({ trainingDays: stores.trainingDays });
  usePlacesStore.setState({ places: stores.places });
  useExerciseProgressStore.setState({ branchData: stores.branchData });
};
