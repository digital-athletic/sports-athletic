/**
 * Prevention-related utility functions for mapping prevention skills to body regions.
 */

/**
 * Map prevention skills to their corresponding body regions.
 * Used in training generation to target specific prevention areas.
 *
 * @param preventionSkills - Array of prevention skill strings (e.g., ["PREVKNEE", "PREVANKLE"])
 * @returns Array of region strings (e.g., ["KNIE", "HUEFTE", "SPRUNGGELENK"])
 */
export function getRegionsForPreventionSkills(
  preventionSkills: string[],
): string[] {
  const prevRegions: string[] = [];

  for (const skill of preventionSkills) {
    switch (skill) {
      case "PREVANKLE":
        prevRegions.push("SPRUNGGELENK");
        break;
      case "PREVKNEE":
        prevRegions.push("KNIE", "HUEFTE", "KNIE_HUEFTE");
        break;
      case "PREVSHOULDER":
        prevRegions.push("SCHULTER");
        break;
      case "PREVSPINE":
        prevRegions.push("WIRBELSAEULE", "WIRBELSAULE");
        break;
      case "PREVWRIST":
        prevRegions.push("HANDGELENK", "ELLBOGEN", "HANDGELENK_ELLENBOGEN");
        break;
      default:
        break;
    }
  }

  return prevRegions;
}
