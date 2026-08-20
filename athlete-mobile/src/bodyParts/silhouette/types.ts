/**
 * Normalized top-level `<g id>` region identifiers found in the four
 * muscle-silhouette SVG assets (Illustrator `_x5F_` decoded to `_`, numeric
 * suffixes stripped). Front and back share NECK, SHOULDER_* and ADDUCTORS_*.
 */
export type SilhouetteRegionId =
  // front (18)
  | "NECK"
  | "SHOULDER_LEFT"
  | "SHOULDER_RIGHT"
  | "CHEST"
  | "BICEPS_LEFT"
  | "BICEPS_RIGHT"
  | "WRIST_FLEXOR_LEFT"
  | "WRIST_FLEXOR_RIGHT"
  | "RECTUS_ABDOMINIS"
  | "OBLIQUES"
  | "ADDUCTORS_LEFT"
  | "ADDUCTORS_RIGHT"
  | "QUADRICEPS_LEFT"
  | "QUADRICEPS_RIGHT"
  | "ABDUCTORS_LEFT"
  | "ABDUCTORS_RIGHT"
  | "SHIN_MUSCLES_LEFT"
  | "SHIN_MUSCLES_RIGHT"
  // back only (13 more; NECK, SHOULDER_* and ADDUCTORS_* repeat)
  | "UPPER_BACK"
  | "LATISSIMUS"
  | "TRICEPS_LEFT"
  | "TRICEPS_RIGHT"
  | "WRIST_EXTENSOR_LEFT"
  | "WRIST_EXTENSOR_RIGHT"
  | "LOWER_BACK"
  | "GLUTES_LEFT"
  | "GLUTES_RIGHT"
  | "HAMSTRINGS_LEFT"
  | "HAMSTRINGS_RIGHT"
  | "CALF_LEFT"
  | "CALF_RIGHT";

export type SilhouetteGender = "MALE" | "FEMALE";

export type SilhouetteRegion = {
  id: SilhouetteRegionId;
  paths: string[];
};

/** Path data extracted from one silhouette SVG asset, in source paint order. */
export type SilhouetteData = {
  viewBox: string;
  bodyPaths: string[];
  regions: SilhouetteRegion[];
};
