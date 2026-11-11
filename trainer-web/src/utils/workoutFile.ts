/**
 * A team workout as a JSON file for the athlete app's "Your trainings" import.
 * The file contains the stored template unchanged, so the app reads exactly
 * what the server stores.
 */
import { readTemplateName } from "./workoutBuilder";

/**
 * The file name derived from the workout name, e.g. "Tuesday stability" →
 * "tuesday-stability.json". Accents are dropped and "ß" becomes "ss"; a name
 * without letters or digits gives "workout.json".
 */
export const workoutFileName = (template: unknown): string => {
  const slug = readTemplateName(template)
    .toLowerCase()
    .replaceAll("ß", "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "workout"}.json`;
};

/** Downloads the stored template, pretty-printed, as a JSON file. */
export const downloadWorkoutFile = (template: unknown): void => {
  const blob = new Blob([JSON.stringify(template, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = workoutFileName(template);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
