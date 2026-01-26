import type { ExerciseType } from "@/schemas/exercise.schema";

/**
 * Type-safe exercise lookup map.
 * Provides O(1) lookup by exercise ID instead of O(n) array search.
 */
export type ExerciseMap = Map<string, ExerciseType>;

/**
 * Converts an exercise array to a lookup map for efficient access.
 * Use this at the entry point of generator methods to enable type-safe lookups.
 */
export function createExerciseMap(exercises: ExerciseType[]): ExerciseMap {
  return new Map(exercises.map((ex) => [ex.id, ex]));
}

/**
 * Safe exercise lookup with explicit undefined handling.
 * Returns undefined if the exercise is not found.
 */
export function getExercise(
  map: ExerciseMap,
  id: string,
): ExerciseType | undefined {
  return map.get(id);
}

/**
 * Exercise lookup that throws a descriptive error for missing exercises.
 * Use when the exercise must exist (e.g., referenced by a valid branch).
 */
export function getExerciseOrThrow(map: ExerciseMap, id: string): ExerciseType {
  const exercise = map.get(id);
  if (!exercise) {
    throw new Error(`Exercise not found: ${id}`);
  }
  return exercise;
}

/**
 * Check if an exercise exists in the map.
 */
export function hasExercise(map: ExerciseMap, id: string): boolean {
  return map.has(id);
}

/**
 * Get exercise with a fallback value if not found.
 * Useful for optional exercises or when a default is acceptable.
 */
export function getExerciseOrDefault(
  map: ExerciseMap,
  id: string,
  defaultValue: ExerciseType,
): ExerciseType {
  return map.get(id) ?? defaultValue;
}
