/**
 * Exercise utility functions for exercise direction, muscles, and body areas.
 */

/**
 * Get the opposing exercise direction for a given direction.
 * Used for creating balanced super sets in training.
 *
 * @param direction - Exercise direction (e.g., "VERTICAL_PUSH")
 * @returns Opposing direction (e.g., "VERTICAL_PULL"), or empty string if no opposite exists
 */
export function getOpposingExerciseDirection(direction: string): string {
  switch (direction) {
    case "VERTICAL_PUSH":
      return "VERTICAL_PULL";
    case "VERTICAL_PULL":
      return "VERTICAL_PUSH";
    case "HORIZONTAL_PUSH":
      return "HORIZONTAL_PULL";
    case "HORIZONTAL_PULL":
      return "HORIZONTAL_PUSH";
    case "HIP":
      return "KNEE";
    case "KNEE":
      return "HIP";
    default:
      return "";
  }
}

/**
 * Map muscles to their body area regions (oberkoerper, unterkoerper, core).
 * Used to filter exercises based on muscle soreness data.
 *
 * @param muscles - Array of muscle tag strings
 * @returns Array of area strings (e.g., ["oberkoerper", "unterkoerper"])
 */
export function getAreasFor(muscles: string[]): string[] {
  const areas = {
    oberkoerper: [
      "BRUST",
      "NACKEN",
      "OBERER_RUECKEN",
      "SCHULTER_RECHTS",
      "SCHULTER_LINKS",
      "SCHULTER_VORNE",
      "SCHULTER_HINTEN",
      "SCHULTER",
      "SCHULTERBLATT_FIXIEREND_HINTEN",
      "SCHULTERBLATT_FIXIEREND_FRONT",
      "BIZEPS_RECHTS",
      "BIZEPS_LINKS",
      "BIZEPS",
      "ARMSTRECKER",
      "ARMSTRECKER_RECHTS",
      "ARMSTRECKER_LINKS",
      "HANDGELENKSBEUGER_RECHTS",
      "HANDGELENKSBEUGER_LINKS",
      "HANDGELENKSBEUGER",
      "FINGER_HANDGELENKSBEUGER_RECHTS",
      "FINGER_HANDGELENKSBEUGER_LINKS",
      "FINGER_HANDGELENKSBEUGER",
      "FINGER_HANDGELENKSMUSKULATUR_RECHTS",
      "FINGER_HANDGELENKSMUSKULATUR_LINKS",
      "FINGER_HANDGELENKSMUSKULATUR",
      "GROSSER_RUECKENMUSKEL_LAT_RECHTS",
      "GROSSER_RUECKENMUSKEL_LAT_LINKS",
      "GROSSER_RUECKENMUSKEL_LAT",
      "HANDGELENKSSTRECKER_RECHTS",
      "HANDGELENKSSTRECKER_LINKS",
      "HANDGELENKSSTRECKER",
    ],
    unterkoerper: [
      "INNERE_OBERSCHENKELMUSKULATUR",
      "OBERSCHENKELVORDERSEITE_LINKS",
      "OBERSCHENKELVORDERSEITE_RECHTS",
      "OBERSCHENKELVORDERSEITE",
      "AEUSSERE_OBERSCHENKELMUSKULATUR_RECHTS",
      "AEUSSERE_OBERSCHENKELMUSKULATUR_LINKS",
      "AEUSSERE_OBERSCHENKELMUSKULATUR",
      "WADE_RECHTS",
      "WADE_LINKS",
      "WADE",
      "WADEN",
      "OBERSCHENKEL_HINTEN_RECHTS",
      "OBERSCHENKEL_HINTEN_LINKS",
      "OBERSCHENKEL_HINTEN",
      "INNERER_OBERSCHENKEL_HINTEN_RECHTS",
      "INNERER_OBERSCHENKEL_HINTEN_LINKS",
      "INNERER_OBERSCHENKEL",
      "AEUSSERER_OBERSCHENKEL",
      "HINTERER_OBERSCHENKEL",
      "SCHIENBEIN",
      "SCHIENBEIN_LI",
      "SCHIENBEIN_RE",
      "SPRUNGGELENK",
      "GESAESS",
      "HUEFT_BEUGER",
      "HUEFT_INNEN_ROTATOR",
      "HUEFT_AUSSEN_ROTATOR",
    ],
    core: ["GERADE_BAUCHMUSKELN", "SEITLICHE_BAUCHMUSKELN", "UNTERER_RUECKEN"],
  };

  return Object.keys(areas).filter((area) =>
    muscles.some((muscle) =>
      areas[area as keyof typeof areas].includes(muscle),
    ),
  );
}
