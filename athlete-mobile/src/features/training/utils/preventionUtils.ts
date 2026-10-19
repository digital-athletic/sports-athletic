import { loadFocusTraining } from "@/data/loadFocusTrainings";

/**
 * Collects the pain regions of the given prevention trainings, read from
 * their templates. Other skills add no regions.
 *
 * @param preventionSkills - Prevention training keys (e.g., ["PREVKNEE", "PREVANKLE"])
 * @returns Array of region strings (e.g., ["KNEE", "HIP", "ANKLE"])
 */
export function getRegionsForPreventionSkills(
  preventionSkills: string[],
): string[] {
  return preventionSkills.flatMap(
    (skill) => loadFocusTraining(skill)?.regions ?? [],
  );
}
