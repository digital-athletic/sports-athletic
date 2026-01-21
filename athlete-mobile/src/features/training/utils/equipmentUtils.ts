import { WorkoutConstants } from "@/constants/workoutConstants";
import type {
  Branch,
  FilterResult,
} from "@/features/training/models/BranchFilter";
import type { ExerciseType } from "@/features/training/models/Exercise";

/**
 * Checks if weight equipment (dumbbells or barbells) is present
 */
export function hasWeights(equipment: string[]): boolean {
  return (
    equipment.includes(WorkoutConstants.EQUIPMENT.DUMBBELL) ||
    equipment.includes(WorkoutConstants.EQUIPMENT.BARBELL) ||
    equipment.includes(WorkoutConstants.EQUIPMENT.BARBELL_MULTIPLE)
  );
}

/**
 * Checks if running/cardio equipment is present
 */
export function hasRunEquipment(equipment: string[]): boolean {
  for (const item of equipment) {
    if (item.includes(WorkoutConstants.EQUIPMENT.TREADMILL)) return true;
    if (item.includes(WorkoutConstants.EQUIPMENT.AREA)) return true;
    if (item.includes(WorkoutConstants.EQUIPMENT.TRACK)) return true;
  }
  return false;
}

/**
 * Checks if given equipment part or equivalent is available
 */
export function equipmentExists(
  part: string,
  equipment: string[],
  otherParts: string[],
  exerciseIds: string[],
): boolean {
  const { EQUIPMENT } = WorkoutConstants;

  // Handle equivalent equipment: med ball and dumbbell are interchangeable
  if (
    (part.includes(EQUIPMENT.MEDICINE_BALL) &&
      otherParts.includes(EQUIPMENT.DUMBBELL)) ||
    (part === EQUIPMENT.DUMBBELL &&
      otherParts.some((op) => op.includes(EQUIPMENT.MEDICINE_BALL)))
  ) {
    return true;
  }

  // Multiple barbells fulfill need for barbell
  if (part === EQUIPMENT.BARBELL) {
    return equipment.some(
      (e) =>
        e.includes(EQUIPMENT.BARBELL) || e.includes(EQUIPMENT.BARBELL_MULTIPLE),
    );
  }

  // Chairs and boxes - allow benches as substitute
  if (part === EQUIPMENT.CHAIR || part === EQUIPMENT.BOX_LOW) {
    return equipment.some(
      (e) =>
        e.includes(EQUIPMENT.BENCH) ||
        e.includes(EQUIPMENT.CHAIR) ||
        e.includes(EQUIPMENT.BOX_LOW),
    );
  }

  // Benches - handle incline bench requirements
  if (part.includes(EQUIPMENT.BENCH)) {
    // Check for exercises that specifically need incline benches
    if (
      part === EQUIPMENT.INCLINE_BENCH &&
      otherParts
        .filter((eq) => eq.includes(EQUIPMENT.BENCH))
        .filter(
          (bench) =>
            bench !== EQUIPMENT.INCLINE_BENCH &&
            bench !== EQUIPMENT.ADJUSTABLE_BENCH,
        ).length === 0
    ) {
      // Only incline bench required
      return (
        equipment.includes(EQUIPMENT.INCLINE_BENCH) ||
        equipment.includes(EQUIPMENT.ADJUSTABLE_BENCH)
      );
    }
    // Check for exercises that specifically need exercise benches
    if (
      exerciseIds.some((id) =>
        WorkoutConstants.EXERCISING_BENCH_EXERCISES?.includes(id),
      )
    ) {
      if (part === EQUIPMENT.EXERCISING_BENCH) {
        return equipment.some((e) => e.includes(EQUIPMENT.EXERCISING_BENCH));
      } else if (part === EQUIPMENT.MULTIPLE_EXERCISING_BENCHES) {
        return equipment.some((e) =>
          e.includes(EQUIPMENT.MULTIPLE_EXERCISING_BENCHES),
        );
      }
    } else {
      // If chair is needed and available, do not require other benches
      if (
        equipment.some((e) => e.includes(EQUIPMENT.CHAIR)) &&
        otherParts.includes(EQUIPMENT.CHAIR)
      ) {
        return true;
      }
      return equipment.some((e) => e.includes(EQUIPMENT.BENCH));
    }
  }

  // Tubes
  if (part.includes(EQUIPMENT.TUBE)) {
    return equipment.some((e) => e.includes(EQUIPMENT.TUBE));
  }

  // Minibands
  if (part.includes(EQUIPMENT.MINIBAND)) {
    return equipment.some((e) => e.includes(EQUIPMENT.MINIBAND));
  }

  // Track & area
  if (part.includes(EQUIPMENT.TRACK) || part.includes(EQUIPMENT.AREA)) {
    return equipment.some(
      (e) => e.includes(EQUIPMENT.TRACK) || e.includes(EQUIPMENT.AREA),
    );
  }

  // Medicine ball
  if (part === EQUIPMENT.MEDICINE_BALL) {
    return equipment.some((e) => e.includes(EQUIPMENT.MEDICINE_BALL));
  }

  // Treadmill - always available, ignore as long as outside run branches unused
  if (part === EQUIPMENT.TREADMILL) {
    return true;
  }

  // Default: check if equipment includes the part
  return equipment.includes(part);
}

/**
 * Checks if equipment or equivalent equipment is available for given exercise
 */
export function equipmentForExerciseExists(
  exercise: ExerciseType,
  equipment: string[],
): boolean {
  const tags = exercise?.tags ?? [];
  const equipmentTags = tags
    .filter((tag) => tag.startsWith("EQ_"))
    .map((tag) => tag.replace("EQ_", ""));
  const exerciseIds = exercise?.id ? [exercise.id] : [];

  for (const eqPart of equipmentTags) {
    if (!equipmentExists(eqPart, equipment, equipmentTags, exerciseIds)) {
      return false;
    }
  }

  return true;
}

/**
 * Filter branches by available equipment.
 */
export function filterByEquipment<T extends Branch>(
  branches: Record<string, T>,
  equipment: string[],
): FilterResult<T> {
  const missingEquipment: string[] = [];
  const equipmentFiltered: Record<string, T> = {};
  const replace: string[] = [];

  for (const id in branches) {
    if (!branches.hasOwnProperty(id)) continue;

    const entry = branches[id];
    const exerciseEq = entry.tags
      .filter((tag) => tag.startsWith("EQ_"))
      .map((tag) => tag.replace("EQ_", ""));

    const levels = entry.levels || entry.exercises;
    if (!levels) continue;

    const exerciseIds = Object.keys(levels).reduce<string[]>(
      (acc, levelKey) => {
        const levelEntry = (
          levels as Record<string, { id?: string; exerciseId?: string }>
        )[levelKey];
        const exerciseId = levelEntry.id ?? levelEntry.exerciseId;
        if (typeof exerciseId === "string" && !acc.includes(exerciseId)) {
          acc.push(exerciseId);
        }
        return acc;
      },
      [],
    );

    let everythingAvailable = true;

    for (const eq of exerciseEq) {
      if (!equipmentExists(eq, equipment, exerciseEq, exerciseIds)) {
        everythingAvailable = false;
        if (!missingEquipment.includes(eq)) {
          missingEquipment.push(eq);
        }
      }
    }

    if (everythingAvailable) {
      equipmentFiltered[id] = entry;
    } else {
      const exerciseRegions = entry.tags
        .filter((tag) => tag.startsWith("REGION_"))
        .map((tag) => tag.replace("REGION_", ""));
      replace.push(...exerciseRegions);
    }
  }

  return {
    keep: equipmentFiltered,
    replace,
    missingEquipment,
  };
}
