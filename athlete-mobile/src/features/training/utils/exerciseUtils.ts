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
 * Map muscles to their body area regions (upperBody, lowerBody, core).
 * Used to filter exercises based on muscle soreness data.
 *
 * @param muscles - Array of muscle tag strings
 * @returns Array of area strings (e.g., ["upperBody", "lowerBody"])
 */
export function getAreasFor(muscles: string[]): string[] {
  const areas = {
    upperBody: [
      "CHEST",
      "NECK",
      "UPPER_BACK",
      "SHOULDER_RIGHT",
      "SHOULDER_LEFT",
      "SHOULDER_FRONT",
      "SHOULDER_FRONT_LEFT",
      "SHOULDER_FRONT_RIGHT",
      "SHOULDER_REAR",
      "SHOULDER_REAR_LEFT",
      "SHOULDER_REAR_RIGHT",
      "SHOULDER",
      "SCAPULAR_STABILIZER_REAR",
      "SCAPULAR_STABILIZER_FRONT",
      "BICEPS_RIGHT",
      "BICEPS_LEFT",
      "BICEPS",
      "TRICEPS",
      "TRICEPS_RIGHT",
      "TRICEPS_LEFT",
      "WRIST_FLEXOR_RIGHT",
      "WRIST_FLEXOR_LEFT",
      "WRIST_FLEXOR",
      "FINGER_WRIST_FLEXOR_RIGHT",
      "FINGER_WRIST_FLEXOR_LEFT",
      "FINGER_WRIST_FLEXOR",
      "FINGER_WRIST_MUSCLES_RIGHT",
      "FINGER_WRIST_MUSCLES_LEFT",
      "FINGER_WRIST_MUSCLES",
      "LATISSIMUS_RIGHT",
      "LATISSIMUS_LEFT",
      "LATISSIMUS",
      "WRIST_EXTENSOR_RIGHT",
      "WRIST_EXTENSOR_LEFT",
      "WRIST_EXTENSOR",
    ],
    lowerBody: [
      "ADDUCTORS",
      "ADDUCTORS_LEFT",
      "ADDUCTORS_RIGHT",
      "QUADRICEPS_LEFT",
      "QUADRICEPS_RIGHT",
      "QUADRICEPS",
      "ABDUCTORS_RIGHT",
      "ABDUCTORS_LEFT",
      "ABDUCTORS",
      "CALF_RIGHT",
      "CALF_LEFT",
      "CALF",
      "CALVES",
      "HAMSTRINGS_RIGHT",
      "HAMSTRINGS_LEFT",
      "HAMSTRINGS",
      "INNER_THIGH_REAR_RIGHT",
      "INNER_THIGH_REAR_LEFT",
      "INNER_THIGH",
      "OUTER_THIGH",
      "HAMSTRINGS",
      "SHIN",
      "SHIN_LEFT",
      "SHIN_RIGHT",
      "ANKLE",
      "GLUTES",
      "GLUTES_LEFT",
      "GLUTES_RIGHT",
      "HIP_FLEXOR",
      "HIP_INTERNAL_ROTATOR",
      "HIP_EXTERNAL_ROTATOR",
    ],
    core: ["RECTUS_ABDOMINIS", "OBLIQUES", "LOWER_BACK"],
  };

  return Object.keys(areas).filter((area) =>
    muscles.some((muscle) =>
      areas[area as keyof typeof areas].includes(muscle),
    ),
  );
}

const areaToRegionTag: Record<string, string> = {
  upperBody: "UPPER_BODY",
  lowerBody: "LOWER_BODY",
  core: "CORE",
};

/**
 * Convert a camelCase area name to its REGION tag equivalent.
 * @param area - camelCase area name (e.g., "upperBody")
 * @returns REGION tag (e.g., "UPPER_BODY")
 */
export function areaToRegion(area: string): string {
  return areaToRegionTag[area] ?? area.toUpperCase();
}
