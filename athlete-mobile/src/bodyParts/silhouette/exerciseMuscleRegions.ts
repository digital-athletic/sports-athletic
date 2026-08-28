import { type Side } from "@/bodyParts/types";
import { type SilhouetteRegionId } from "./types";

/**
 * Exercise-tag → silhouette-region resolution for the exercise detail
 * silhouettes. Keyed on the RAW tag vocabulary from getTagValues (the values
 * in assets/data/generator/Exercises.json), deliberately NOT on
 * expandMuscleTags output: that expansion collapses SHOULDER, SHOULDER_FRONT
 * and SHOULDER_REAR to one value, destroying the front/rear distinction this
 * table must express.
 *
 * Third of three mapping tables, each with exactly one consumer:
 *   - muscleTagToBodyParts (muscleTagMapping.ts)  → muscle chips
 *   - FRONT/BACK_TAG_BY_REGION (regionMapping.ts) → soreness selection
 *   - this table                                   → exercise detail silhouettes
 * Kept separate because regionsForTag runs over PERSISTED user soreness tags
 * (MuscleSorenessSelector.tsx); widening it would change what already-stored
 * data highlights. Fold all three into one table once the soreness tags have
 * a migration.
 */
type RegionsBySide = {
  FRONT: SilhouetteRegionId[];
  BACK: SilhouetteRegionId[];
};

/**
 * Exported so tests can assert its key set against the catalog's tag
 * vocabulary (see exerciseMuscleRegions.spec.ts); not consumed elsewhere.
 */
export const EXERCISE_REGIONS_BY_TAG: Record<string, RegionsBySide> = {
  ANKLE: {
    FRONT: ["SHIN_MUSCLES_LEFT", "SHIN_MUSCLES_RIGHT"],
    BACK: ["CALF_LEFT", "CALF_RIGHT"],
  },
  BICEPS: {
    FRONT: ["BICEPS_LEFT", "BICEPS_RIGHT"],
    BACK: [],
  },
  CALF: {
    FRONT: [],
    BACK: ["CALF_LEFT", "CALF_RIGHT"],
  },
  CARDIO: {
    FRONT: [],
    BACK: [],
  },
  CHEST: {
    FRONT: ["CHEST"],
    BACK: [],
  },
  FINGER_WRIST_MUSCLES: {
    FRONT: ["WRIST_FLEXOR_LEFT", "WRIST_FLEXOR_RIGHT"],
    BACK: ["WRIST_EXTENSOR_LEFT", "WRIST_EXTENSOR_RIGHT"],
  },
  GLUTES: {
    FRONT: [],
    BACK: ["GLUTES_LEFT", "GLUTES_RIGHT"],
  },
  HAMSTRINGS: {
    FRONT: [],
    BACK: ["HAMSTRINGS_LEFT", "HAMSTRINGS_RIGHT"],
  },
  HEART: {
    FRONT: [],
    BACK: [],
  },
  HIP_EXTERNAL_ROTATOR: {
    FRONT: [],
    BACK: ["GLUTES_LEFT", "GLUTES_RIGHT"],
  },
  HIP_FLEXOR: {
    FRONT: ["QUADRICEPS_LEFT", "QUADRICEPS_RIGHT"],
    BACK: [],
  },
  HIP_INTERNAL_ROTATOR: {
    FRONT: ["ADDUCTORS_LEFT", "ADDUCTORS_RIGHT"],
    BACK: ["ADDUCTORS_LEFT", "ADDUCTORS_RIGHT"],
  },
  INNER_THIGH: {
    FRONT: ["ADDUCTORS_LEFT", "ADDUCTORS_RIGHT"],
    BACK: ["ADDUCTORS_LEFT", "ADDUCTORS_RIGHT"],
  },
  LATISSIMUS: {
    FRONT: [],
    BACK: ["LATISSIMUS"],
  },
  LOWER_BACK: {
    FRONT: [],
    BACK: ["LOWER_BACK"],
  },
  MUSCLE_HAMSTRINGS: {
    FRONT: [],
    BACK: ["HAMSTRINGS_LEFT", "HAMSTRINGS_RIGHT"],
  },
  NECK: {
    FRONT: ["NECK"],
    BACK: ["NECK"],
  },
  NECK_FRONT: {
    FRONT: ["NECK"],
    BACK: [],
  },
  NECK_LATERAL: {
    FRONT: ["NECK"],
    BACK: ["NECK"],
  },
  NECK_REAR: {
    FRONT: [],
    BACK: ["NECK"],
  },
  OBLIQUES: {
    FRONT: ["OBLIQUES"],
    BACK: [],
  },
  OUTER_THIGH: {
    FRONT: ["ABDUCTORS_LEFT", "ABDUCTORS_RIGHT"],
    BACK: [],
  },
  QUADRICEPS: {
    FRONT: ["QUADRICEPS_LEFT", "QUADRICEPS_RIGHT"],
    BACK: [],
  },
  RECTUS_ABDOMINIS: {
    FRONT: ["RECTUS_ABDOMINIS"],
    BACK: [],
  },
  SCAPULAR_STABILIZER_FRONT: {
    FRONT: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
    BACK: ["UPPER_BACK"],
  },
  SCAPULAR_STABILIZER_REAR: {
    FRONT: [],
    BACK: ["SHOULDER_LEFT", "SHOULDER_RIGHT", "UPPER_BACK"],
  },
  SHIN: {
    FRONT: ["SHIN_MUSCLES_LEFT", "SHIN_MUSCLES_RIGHT"],
    BACK: [],
  },
  SHOULDER: {
    FRONT: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
    BACK: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
  },
  SHOULDER_FRONT: {
    FRONT: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
    BACK: [],
  },
  SHOULDER_REAR: {
    FRONT: [],
    BACK: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
  },
  TRICEPS: {
    FRONT: [],
    BACK: ["TRICEPS_LEFT", "TRICEPS_RIGHT"],
  },
  UPPER_BACK: {
    FRONT: [],
    BACK: ["UPPER_BACK"],
  },
  WRIST_EXTENSOR: {
    FRONT: [],
    BACK: ["WRIST_EXTENSOR_LEFT", "WRIST_EXTENSOR_RIGHT"],
  },
  WRIST_FLEXOR: {
    FRONT: ["WRIST_FLEXOR_LEFT", "WRIST_FLEXOR_RIGHT"],
    BACK: [],
  },
};

/** Region ids for a single raw exercise tag. Unknown tags return `[]`. */
export function regionsForExerciseTag(
  tag: string,
  side: Side,
): readonly SilhouetteRegionId[] {
  return EXERCISE_REGIONS_BY_TAG[tag]?.[side] ?? [];
}

/**
 * Region ids for a set of raw exercise tags, de-duplicated while preserving
 * side-region order.
 */
export function resolveExerciseRegions(
  tags: readonly string[],
  side: Side,
): readonly SilhouetteRegionId[] {
  const seen = new Set<SilhouetteRegionId>();
  const result: SilhouetteRegionId[] = [];

  for (const tag of tags) {
    for (const region of regionsForExerciseTag(tag, side)) {
      if (!seen.has(region)) {
        seen.add(region);
        result.push(region);
      }
    }
  }

  return result;
}
