import { type MuscleType, type Side } from "@/bodyParts/types";
import { type SilhouetteRegionId } from "./types";

/**
 * Emitted soreness tag per region: lateral regions keep their side
 * (left biceps stays left), central regions use the plain muscle name.
 * Shoulders are the one side-dependent entry — the artwork shows the same
 * arm from two orientations, and exercise display later needs the
 * front/rear distinction, so each view emits its own value.
 *
 * Deliberately independent of muscleTagMapping.expandMuscleTags: several of
 * its outputs (generic ABDUCTORS/ADDUCTORS/CALVES/SHIN, LATISSIMUS_LEFT/RIGHT,
 * asymmetric legacy values) have no silhouette region to highlight.
 */
const FRONT_TAG_BY_REGION: Record<SilhouetteRegionId, MuscleType> = {
  NECK: "NECK",
  SHOULDER_LEFT: "SHOULDER_FRONT_LEFT",
  SHOULDER_RIGHT: "SHOULDER_FRONT_RIGHT",
  CHEST: "CHEST",
  BICEPS_LEFT: "BICEPS_LEFT",
  BICEPS_RIGHT: "BICEPS_RIGHT",
  WRIST_FLEXOR_LEFT: "WRIST_FLEXOR_LEFT",
  WRIST_FLEXOR_RIGHT: "WRIST_FLEXOR_RIGHT",
  RECTUS_ABDOMINIS: "RECTUS_ABDOMINIS",
  OBLIQUES: "OBLIQUES",
  ADDUCTORS_LEFT: "ADDUCTORS_LEFT",
  ADDUCTORS_RIGHT: "ADDUCTORS_RIGHT",
  QUADRICEPS_LEFT: "QUADRICEPS_LEFT",
  QUADRICEPS_RIGHT: "QUADRICEPS_RIGHT",
  ABDUCTORS_LEFT: "ABDUCTORS_LEFT",
  ABDUCTORS_RIGHT: "ABDUCTORS_RIGHT",
  SHIN_MUSCLES_LEFT: "SHIN_LEFT",
  SHIN_MUSCLES_RIGHT: "SHIN_RIGHT",
  UPPER_BACK: "UPPER_BACK",
  LATISSIMUS: "LATISSIMUS",
  TRICEPS_LEFT: "TRICEPS_LEFT",
  TRICEPS_RIGHT: "TRICEPS_RIGHT",
  WRIST_EXTENSOR_LEFT: "WRIST_EXTENSOR_LEFT",
  WRIST_EXTENSOR_RIGHT: "WRIST_EXTENSOR_RIGHT",
  LOWER_BACK: "LOWER_BACK",
  GLUTES_LEFT: "GLUTES_LEFT",
  GLUTES_RIGHT: "GLUTES_RIGHT",
  HAMSTRINGS_LEFT: "HAMSTRINGS_LEFT",
  HAMSTRINGS_RIGHT: "HAMSTRINGS_RIGHT",
  CALF_LEFT: "CALF_LEFT",
  CALF_RIGHT: "CALF_RIGHT",
};

const BACK_TAG_BY_REGION: Record<SilhouetteRegionId, MuscleType> = {
  ...FRONT_TAG_BY_REGION,
  SHOULDER_LEFT: "SHOULDER_REAR_LEFT",
  SHOULDER_RIGHT: "SHOULDER_REAR_RIGHT",
};

/** The 18 region ids that actually render on the front silhouette. */
export const FRONT_REGION_IDS: readonly SilhouetteRegionId[] = [
  "NECK",
  "SHOULDER_LEFT",
  "SHOULDER_RIGHT",
  "CHEST",
  "BICEPS_LEFT",
  "BICEPS_RIGHT",
  "WRIST_FLEXOR_LEFT",
  "WRIST_FLEXOR_RIGHT",
  "RECTUS_ABDOMINIS",
  "OBLIQUES",
  "ADDUCTORS_LEFT",
  "ADDUCTORS_RIGHT",
  "ABDUCTORS_LEFT",
  "ABDUCTORS_RIGHT",
  "QUADRICEPS_LEFT",
  "QUADRICEPS_RIGHT",
  "SHIN_MUSCLES_LEFT",
  "SHIN_MUSCLES_RIGHT",
];

/** The 18 region ids that actually render on the back silhouette. */
export const BACK_REGION_IDS: readonly SilhouetteRegionId[] = [
  "NECK",
  "UPPER_BACK",
  "SHOULDER_LEFT",
  "SHOULDER_RIGHT",
  "LATISSIMUS",
  "TRICEPS_LEFT",
  "TRICEPS_RIGHT",
  "WRIST_EXTENSOR_LEFT",
  "WRIST_EXTENSOR_RIGHT",
  "LOWER_BACK",
  "GLUTES_LEFT",
  "GLUTES_RIGHT",
  "ADDUCTORS_LEFT",
  "ADDUCTORS_RIGHT",
  "HAMSTRINGS_LEFT",
  "HAMSTRINGS_RIGHT",
  "CALF_LEFT",
  "CALF_RIGHT",
];

export function toMuscleTag(
  region: SilhouetteRegionId,
  side: Side,
): MuscleType {
  const table = side === "FRONT" ? FRONT_TAG_BY_REGION : BACK_TAG_BY_REGION;
  return table[region];
}

/**
 * Inverse lookup: which region ids on the given side represent `tag`.
 * Returns `[]` for any tag outside the mapped vocabulary so that unknown or
 * legacy persisted tags (e.g. old generic values) never crash the renderer.
 */
export function regionsForTag(tag: string, side: Side): SilhouetteRegionId[] {
  const regionIds = side === "FRONT" ? FRONT_REGION_IDS : BACK_REGION_IDS;
  const table = side === "FRONT" ? FRONT_TAG_BY_REGION : BACK_TAG_BY_REGION;
  return regionIds.filter((id) => table[id] === tag);
}
