import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface TrainingDayType {
  weekday: number; // 0-6 (Monday-Sunday)
  active: boolean;
  place?: string; // Location ID
  duration?: string; // "hh:mm" format
}

export interface TrainingScheduleState {
  trainingDays: TrainingDayType[];

  // Actions
  setTrainingDays: (days: TrainingDayType[]) => void;
  toggleDay: (weekday: number) => void;
  setDayLocation: (weekday: number, placeId: string) => void;
  setDayDuration: (weekday: number, duration: string) => void;
  resetToDefaults: () => void;

  // Selectors
  getActiveTrainingDays: () => TrainingDayType[];
  getTotalActiveHours: () => number;
}

const DEFAULT_TRAINING_DAYS: TrainingDayType[] = [
  { weekday: 0, active: false }, // Monday
  { weekday: 1, active: false }, // Tuesday
  { weekday: 2, active: false }, // Wednesday
  { weekday: 3, active: false }, // Thursday
  { weekday: 4, active: false }, // Friday
  { weekday: 5, active: false }, // Saturday
  { weekday: 6, active: false }, // Sunday
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
 * setDayDuration(1, '01:30');
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
          (day) => day.active && day.duration
        );
        return activeDays.reduce((total, day) => {
          if (!day.duration) return total;
          const [hours, minutes] = day.duration.split(":").map(Number);
          return total + hours + minutes / 60;
        }, 0);
      },
    })),
    {
      name: "training-schedule-storage",
      storage: asyncStorage,
    }
  )
);
