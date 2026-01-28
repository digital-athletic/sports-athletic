/**
 * Prevention-related utility functions for mapping prevention skills to body regions.
 */

/**
 * Map prevention skills to their corresponding body regions.
 * Used in training generation to target specific prevention areas.
 *
 * @param preventionSkills - Array of prevention skill strings (e.g., ["PREVKNEE", "PREVANKLE"])
 * @returns Array of region strings (e.g., ["KNEE", "HIP", "ANKLE"])
 */
export function getRegionsForPreventionSkills(
  preventionSkills: string[],
): string[] {
  const prevRegions: string[] = [];

  for (const skill of preventionSkills) {
    switch (skill) {
      case "PREVANKLE":
        prevRegions.push("ANKLE");
        break;
      case "PREVKNEE":
        prevRegions.push("KNEE", "HIP", "KNEE_HIP");
        break;
      case "PREVSHOULDER":
        prevRegions.push("SHOULDER");
        break;
      case "PREVSPINE":
        prevRegions.push("SPINE");
        break;
      case "PREVWRIST":
        prevRegions.push("WRIST", "ELBOW", "WRIST_ELBOW");
        break;
      default:
        break;
    }
  }

  return prevRegions;
}
