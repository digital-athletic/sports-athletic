import type { ActiveTrainingType } from "../models/ActiveTraining";
import type { TrainingTimeType } from "../models/Training";

/**
 * Returns true when a training session can be resumed:
 * it was started (time.start is set) but not yet finished (time.end is unset).
 */
export function isResumableSession(
  activeTraining: ActiveTrainingType | null,
  time: TrainingTimeType,
): boolean {
  return (
    activeTraining !== null &&
    time.start !== undefined &&
    time.end === undefined
  );
}

/**
 * Returns true when there is leftover state that cannot be resumed:
 * activeTraining exists but the session is not in a resumable state.
 */
export function hasStaleLeftovers(
  activeTraining: ActiveTrainingType | null,
  time: TrainingTimeType,
): boolean {
  return activeTraining !== null && !isResumableSession(activeTraining, time);
}
