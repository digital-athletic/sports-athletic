/**
 * Training schedule store - weekly training days configuration.
 */

import type { TrainingScheduleState, StoreState } from "../types";

/**
 * Default training schedule: Tuesday (weekday 1) and Friday (weekday 4).
 */
const DEFAULT_TRAINING_DAYS = [
  { active: false, weekday: 0, duration: 30, place: "STUDIO" },
  { active: true, weekday: 1, duration: 30, place: "STUDIO" }, // Tuesday
  { active: false, weekday: 2, duration: 30, place: "STUDIO" },
  { active: false, weekday: 3, duration: 30, place: "STUDIO" },
  { active: true, weekday: 4, duration: 30, place: "STUDIO" }, // Friday
  { active: false, weekday: 5, duration: 30, place: "STUDIO" },
  { active: false, weekday: 6, duration: 30, place: "STUDIO" },
];

export interface TrainingScheduleStoreOptions {
  trainingDays?: typeof DEFAULT_TRAINING_DAYS;
}

export function createTrainingScheduleStore(
  options: TrainingScheduleStoreOptions = {},
): StoreState<TrainingScheduleState> {
  const { trainingDays = DEFAULT_TRAINING_DAYS } = options;

  return {
    version: 14,
    state: {
      trainingDays,
    },
  };
}
