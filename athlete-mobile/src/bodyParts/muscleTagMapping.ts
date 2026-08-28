import { type MuscleType } from "./types";

/**
 * Maps generic exercise muscle tag names to the lateralized body part
 * names used in the body diagram data arrays. Tags that already are body
 * part names carry an identity row; a tag absent from this table is
 * dropped by expandMuscleTags rather than leaking an unchecked string.
 */
const muscleTagToBodyParts: Record<string, MuscleType[]> = {
  QUADRICEPS: ["QUADRICEPS_LEFT", "QUADRICEPS_RIGHT"],
  OUTER_THIGH: ["ABDUCTORS"],
  HAMSTRINGS: ["HAMSTRINGS_LEFT", "HAMSTRINGS_RIGHT"],
  INNER_THIGH: ["ADDUCTORS"],
  CALF: ["CALF_LEFT", "CALF_RIGHT", "CALVES"],
  TRICEPS: ["TRICEPS_LEFT", "TRICEPS_RIGHT"],
  BICEPS: ["BICEPS_LEFT", "BICEPS_RIGHT"],
  SHOULDER: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
  SHOULDER_FRONT: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
  SHOULDER_REAR: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
  LATISSIMUS: ["LATISSIMUS_LEFT", "LATISSIMUS_RIGHT"],
  WRIST_FLEXOR: ["WRIST_FLEXOR_LEFT", "WRIST_FLEXOR_RIGHT"],
  WRIST_EXTENSOR: ["WRIST_EXTENSOR_LEFT", "WRIST_EXTENSOR_RIGHT"],
  FINGER_WRIST_MUSCLES: [
    "FINGER_WRIST_MUSCLES_LEFT",
    "FINGER_WRIST_MUSCLES_RIGHT",
  ],
  MUSCLE_HAMSTRINGS: ["HAMSTRINGS_LEFT", "HAMSTRINGS_RIGHT"],
  HIP_FLEXOR: ["QUADRICEPS_LEFT", "QUADRICEPS_RIGHT"],
  HIP_EXTERNAL_ROTATOR: ["GLUTES"],
  HIP_INTERNAL_ROTATOR: ["ADDUCTORS"],
  SCAPULAR_STABILIZER_FRONT: ["SHOULDER_LEFT", "SHOULDER_RIGHT", "UPPER_BACK"],
  SCAPULAR_STABILIZER_REAR: ["SHOULDER_LEFT", "SHOULDER_RIGHT", "UPPER_BACK"],
  ANKLE: ["CALF_LEFT", "CALF_RIGHT", "CALVES", "SHIN"],
  CARDIO: ["CARDIO"],
  CHEST: ["CHEST"],
  GLUTES: ["GLUTES"],
  LOWER_BACK: ["LOWER_BACK"],
  NECK: ["NECK"],
  NECK_FRONT: ["NECK_FRONT"],
  NECK_LATERAL: ["NECK_LATERAL"],
  NECK_REAR: ["NECK_REAR"],
  OBLIQUES: ["OBLIQUES"],
  RECTUS_ABDOMINIS: ["RECTUS_ABDOMINIS"],
  SHIN: ["SHIN"],
  UPPER_BACK: ["UPPER_BACK"],
};

/**
 * Expands generic muscle tag names to the body part names used
 * by the body diagram, so that diagram overlays render correctly.
 */
export function expandMuscleTags(tags: string[]): MuscleType[] {
  const expanded = new Set<MuscleType>();

  for (const tag of tags) {
    for (const name of muscleTagToBodyParts[tag] ?? []) {
      expanded.add(name);
    }
  }

  return Array.from(expanded);
}
