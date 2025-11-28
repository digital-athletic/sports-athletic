import { PlaceType } from "@/constants/workoutConstants";
import { TrainingDayType } from "@/features/training/models/TrainingDay";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface TrainingScheduleState {
  trainingDays: TrainingDayType[];

  // Actions
  setTrainingDays: (days: TrainingDayType[]) => void;
  toggleDay: (weekday: number) => void;
  setDayLocation: (weekday: number, placeId: PlaceType) => void;
  setDayDuration: (weekday: number, duration: number) => void;
  resetToDefaults: () => void;

  // Selectors
  getActiveTrainingDays: () => TrainingDayType[];
  getTotalActiveHours: () => number;
}

const DEFAULT_TRAINING_DAYS: TrainingDayType[] = [
  {
    active: false,
    weekday: 0, // Monday
    duration: 30,
    place: "STUDIO",
  },
  {
    active: false,
    weekday: 1, // Tuesday
    duration: 30,
    place: "STUDIO",
  },
  {
    active: false,
    weekday: 2, // Wednesday
    duration: 30,
    place: "STUDIO",
  },
  {
    active: false,
    weekday: 3, // Thursday
    duration: 30,
    place: "STUDIO",
  },
  {
    active: false,
    weekday: 4, // Friday
    duration: 30,
    place: "STUDIO",
  },
  {
    active: false,
    weekday: 5, // Saturday
    duration: 30,
    place: "STUDIO",
  },
  {
    active: false,
    weekday: 6, // Sunday
    duration: 30,
    place: "STUDIO",
  },
];

/**
 * Training Schedule Store
 *
 * Manages weekly training schedule configuration.
 * Used for workout generation and scheduling features.
 *
 * @example
 * ```tsx
 * const { trainingDays, toggleDay, setDayDuration, getActiveTrainingDays } = useTrainingScheduleStore();
 *
 * // Toggle Monday active/inactive
 * toggleDay(0);
 *
 * // Set training duration for Tuesday
 * setDayDuration(1, 90);
 *
 * // Get only active days
 * const activeDays = getActiveTrainingDays();
 * ```
 */
export const useTrainingScheduleStore = create<TrainingScheduleState>()(
  persist(
    immer((set, get) => ({
      trainingDays: DEFAULT_TRAINING_DAYS,

      setTrainingDays: (days) =>
        set((state) => {
          state.trainingDays = days;
        }),

      toggleDay: (weekday) =>
        set((state) => {
          const day = state.trainingDays.find((d) => d.weekday === weekday);
          if (day) {
            day.active = !day.active;
          }
        }),

      setDayLocation: (weekday, placeId) =>
        set((state) => {
          const day = state.trainingDays.find((d) => d.weekday === weekday);
          if (day) {
            day.place = placeId;
          }
        }),

      setDayDuration: (weekday, duration) =>
        set((state) => {
          const day = state.trainingDays.find((d) => d.weekday === weekday);
          if (day) {
            day.duration = duration;
          }
        }),

      resetToDefaults: () =>
        set((state) => {
          state.trainingDays = DEFAULT_TRAINING_DAYS;
        }),

      getActiveTrainingDays: () =>
        get().trainingDays.filter((day) => day.active),

      getTotalActiveHours: () => {
        const activeDays = get().trainingDays.filter(
          (day) => day.active && day.duration,
        );
        return activeDays.reduce((total, day) => {
          if (!day.duration) return total;
          return total + day.duration / 60;
        }, 0);
      },
    })),
    {
      name: "training-schedule-storage",
      storage: asyncStorage,
    },
  ),
);
