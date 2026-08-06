import type { ActiveTrainingType } from "../models/ActiveTraining";
import type { TrainingTimeType } from "../models/Training";
import type { TrainingViewMode } from "../trainingStore";

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

/**
 * Picks the training route matching the persisted session mode, falling
 * back to the sequential screen if list-view mode isn't currently
 * available (e.g. the feature flag was rolled back after a checklist
 * session was started) so resuming never targets an unreachable screen.
 */
export function getTrainingRouteForMode(
  trainingViewMode: TrainingViewMode | null,
  listViewEnabled: boolean,
): "/training/training-list" | "/training/training-active" {
  return trainingViewMode === "LIST" && listViewEnabled
    ? "/training/training-list"
    : "/training/training-active";
}
