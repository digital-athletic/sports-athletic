import { type MuscleType } from "./types";

/**
 * Maps generic exercise muscle tag names to the lateralized body part
 * names used in the body diagram data arrays.
 */
const muscleTagToBodyParts: Record<string, MuscleType[]> = {
  QUADRICEPS: ["QUADRICEPS_LEFT", "QUADRICEPS_RIGHT"],
  OUTER_THIGH: ["ABDUCTORS", "ABDUCTORS_RIGHT", "OUTER_THIGH_REAR_RIGHT"],
  HAMSTRINGS: ["HAMSTRINGS_LEFT", "HAMSTRINGS_RIGHT"],
  INNER_THIGH: ["ADDUCTORS", "INNER_THIGH_REAR_LEFT"],
  CALF: ["CALF_LEFT", "CALF_RIGHT", "CALVES"],
  TRICEPS: ["TRICEPS_LEFT", "TRICEPS_RIGHT"],
  BICEPS: ["BICEPS_LEFT", "BICEPS_RIGHT"],
  SHOULDER: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
  SHOULDER_FRONT: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
  SHOULDER_REAR: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
  LATISSIMUS: ["LATISSIMUS_LEFT", "LATISSIMUS_RIGHT"],
  WRIST_FLEXOR: [
    "WRIST_FLEXOR_RIGHT",
    "WRIST_FLEXOR_LEFT",
    "FINGER_WRIST_FLEXOR_LEFT",
  ],
  WRIST_EXTENSOR: ["WRIST_EXTENSOR_LEFT", "WRIST_EXTENSOR_RIGHT"],
  FINGER_WRIST_MUSCLES: [
    "FINGER_WRIST_MUSCLES_LEFT",
    "FINGER_WRIST_MUSCLES_RIGHT",
  ],
  MUSCLE_HAMSTRINGS: ["HAMSTRINGS_LEFT", "HAMSTRINGS_RIGHT"],
  HIP_FLEXOR: ["QUADRICEPS_LEFT", "QUADRICEPS_RIGHT"],
  HIP_EXTERNAL_ROTATOR: ["GLUTES", "OUTER_THIGH_REAR_RIGHT"],
  HIP_INTERNAL_ROTATOR: ["ADDUCTORS", "INNER_THIGH_REAR_LEFT"],
  SCAPULAR_STABILIZER_FRONT: ["SHOULDER_LEFT", "SHOULDER_RIGHT", "UPPER_BACK"],
  SCAPULAR_STABILIZER_REAR: ["SHOULDER_LEFT", "SHOULDER_RIGHT", "UPPER_BACK"],
  ANKLE: ["CALF_LEFT", "CALF_RIGHT", "CALVES", "SHIN"],
};

/**
 * Expands generic muscle tag names to the body part names used
 * by the body diagram, so that diagram overlays render correctly.
 */
export function expandMuscleTags(tags: string[]): MuscleType[] {
  const expanded = new Set<string>();

  for (const tag of tags) {
    const mapped = muscleTagToBodyParts[tag];
    if (mapped) {
      for (const name of mapped) {
        expanded.add(name);
      }
    } else {
      expanded.add(tag);
    }
  }

  return Array.from(expanded) as MuscleType[];
}
