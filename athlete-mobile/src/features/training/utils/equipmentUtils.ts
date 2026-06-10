import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type {
  Branch,
  FilterResult,
} from "@/features/training/models/BranchFilter";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { PlacesData } from "@/store/placesStore";
import { getTagValues } from "@/utils/tagUtils";

/**
 * Checks if barbell equipment (single or multiple) is present
 */
export function hasBarbell(equipment: string[]): boolean {
  return (
    equipment.includes(WorkoutConstants.EQUIPMENT.BARBELL) ||
    equipment.includes(WorkoutConstants.EQUIPMENT.BARBELL_MULTIPLE)
  );
}

/**
 * Checks if any training place has barbell equipment
 */
export function hasAnyBarbell(places: PlacesData): boolean {
  return Object.values(places).some((p) => hasBarbell(p.equipment));
}

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
 * Equipment keywords that indicate running/cardio capability
 */
const RUN_EQUIPMENT_KEYWORDS = [
  WorkoutConstants.EQUIPMENT.TREADMILL,
  WorkoutConstants.EQUIPMENT.AREA,
  WorkoutConstants.EQUIPMENT.TRACK,
] as const;

/**
 * Checks if running/cardio equipment is present
 */
export function hasRunEquipment(equipment: string[]): boolean {
  return equipment.some((item) =>
    RUN_EQUIPMENT_KEYWORDS.some((keyword) => item.includes(keyword)),
  );
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
  const equipmentTags = getTagValues(tags, TagGroups.EQUIPMENT);
  const exerciseIds = exercise?.id ? [exercise.id] : [];

  return equipmentTags.every((eqPart) =>
    equipmentExists(eqPart, equipment, equipmentTags, exerciseIds),
  );
}

type LevelEntry = { exerciseId: string };
type Levels = Record<number, LevelEntry>;

/**
 * Extracts unique exercise IDs from a branch's levels/exercises.
 * Pure function with no side effects.
 */
function extractExerciseIds(levels: Levels | undefined): string[] {
  if (!levels) {
    return [];
  }

  const ids = Object.values(levels)
    .map((level) => level.exerciseId)
    .filter((id): id is string => typeof id === "string");

  return [...new Set(ids)];
}

/**
 * Analyzes a branch to determine equipment availability.
 */
function analyzeBranchEquipment(
  entry: Branch,
  equipment: string[],
): { available: boolean; missing: string[] } {
  const exerciseEq = getTagValues(entry.tags ?? [], TagGroups.EQUIPMENT);
  const levels = entry.levels || entry.exercises;
  const exerciseIds = extractExerciseIds(levels as Levels);

  const missing = exerciseEq.filter(
    (eq) => !equipmentExists(eq, equipment, exerciseEq, exerciseIds),
  );

  return {
    available: missing.length === 0,
    missing,
  };
}

/**
 * Filter branches by available equipment.
 * Returns branches that have all required equipment, plus metadata about
 * missing equipment and regions that need replacement exercises.
 */
export function filterByEquipment<T extends Branch>(
  branches: Record<string, T>,
  equipment: string[],
): FilterResult<T> {
  const entries = Object.entries(branches);

  // Analyze each branch for equipment availability
  const analyzed = entries
    .filter(([, entry]) => entry.levels || entry.exercises)
    .map(([id, entry]) => {
      const { available, missing } = analyzeBranchEquipment(entry, equipment);
      const regions = available
        ? []
        : getTagValues(entry.tags ?? [], TagGroups.REGION);

      return { id, entry, available, missing, regions };
    });

  // Partition into kept and filtered branches
  const kept = analyzed.filter((item) => item.available);
  const filtered = analyzed.filter((item) => !item.available);

  // Build result immutably
  return {
    keep: Object.fromEntries(
      kept.map((item) => [item.id, item.entry]),
    ) as Record<string, T>,
    replace: [...new Set(filtered.flatMap((item) => item.regions))],
    missingEquipment: [...new Set(filtered.flatMap((item) => item.missing))],
  };
}
