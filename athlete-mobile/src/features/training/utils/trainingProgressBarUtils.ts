/** Props shared by every platform variant of TrainingProgressBar. */
export type TrainingProgressBarProps = {
  /** Completed share of the training, from 0 to 1. */
  progress: number;
};

export const TRAINING_PROGRESS_BAR_TEST_ID = "training-progress-bar";

/** Limits a progress value to the 0 to 1 range the native bars expect. */
export const clampProgress = (progress: number): number =>
  Math.min(1, Math.max(0, progress));
