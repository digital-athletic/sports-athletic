import { Logger } from "@/services/Logger";
import type { ActiveTrainingType } from "../models/ActiveTraining";
import { isPreventionTraining } from "./skillTreeUtils";

/**
 * Logs a training analytics event, additionally logging a `prevention_`-prefixed
 * variant when the active training is a prevention training.
 */
export function logTrainingEvent(
  activeTraining: ActiveTrainingType | null,
  eventName: string,
  data?: Record<string, unknown>,
) {
  if (!activeTraining) return;

  const eventData = {
    type: activeTraining.type,
    ...data,
  };

  if (isPreventionTraining(activeTraining.type)) {
    Logger.logEvent(`prevention_${eventName}`, eventData);
  }
  Logger.logEvent(eventName, eventData);
}
