export type AbortExit = "SELECTION" | "ORIGIN" | "HOME";

/** Name of the selection screen route (app/training/new.tsx) in the training stack. */
export const SELECTION_ROUTE_NAME = "new";

/**
 * Picks where an aborted workout returns to: the selection screen when the
 * training stack contains it, else the screen below the whole training stack,
 * else Home (a resumed session has nothing below it).
 */
export function resolveAbortExit(
  trainingRouteNames: string[],
  parentCanGoBack: boolean,
): AbortExit {
  if (trainingRouteNames.includes(SELECTION_ROUTE_NAME)) return "SELECTION";
  if (parentCanGoBack) return "ORIGIN";
  return "HOME";
}
