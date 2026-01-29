/**
 * Exercise Registry
 *
 * Module-level singleton registry for exercise data.
 * Provides O(1) lookups by ID via Map and lazy initialization.
 *
 * This replaces the Zustand-based exercisesStore with a simpler,
 * non-persisted approach since exercises are bundled static data.
 */

import type { ExerciseType } from "@/schemas/exercise.schema";
import { loadExercises } from "./loadExercises";

// Module-level singleton state
let exerciseRegistry: Map<string, ExerciseType> | null = null;
let exerciseArray: ExerciseType[] | null = null;

/**
 * Initializes the exercise registry if not already initialized.
 * Uses lazy initialization - data is loaded on first access.
 */
function ensureInitialized(): void {
  if (exerciseRegistry === null || exerciseArray === null) {
    exerciseArray = loadExercises();
    exerciseRegistry = new Map<string, ExerciseType>();

    for (const exercise of exerciseArray) {
      exerciseRegistry.set(exercise.id, exercise);
    }
  }
}

/**
 * Gets an exercise by its ID.
 * Uses O(1) Map lookup.
 *
 * @param id - The exercise ID to look up
 * @returns The exercise if found, undefined otherwise
 */
export function getExerciseById(id: string): ExerciseType | undefined {
  ensureInitialized();
  return exerciseRegistry!.get(id);
}

/**
 * Gets all exercises matching a specific tag.
 *
 * @param tag - The tag to filter by
 * @returns Array of exercises containing the specified tag
 */
export function getExercisesByTag(tag: string): ExerciseType[] {
  ensureInitialized();
  return exerciseArray!.filter((exercise) => exercise.tags.includes(tag));
}

/**
 * Gets all exercises in the registry.
 *
 * @returns The full array of exercises
 */
export function getAllExercises(): ExerciseType[] {
  ensureInitialized();
  return exerciseArray!;
}

/**
 * Gets the underlying Map for direct access (used by generators).
 *
 * @returns The exercise registry Map
 */
export function getExerciseRegistry(): Map<string, ExerciseType> {
  ensureInitialized();
  return exerciseRegistry!;
}

/**
 * Clears the registry, allowing re-initialization.
 * Primarily used for testing purposes.
 */
export function clearExerciseRegistry(): void {
  exerciseRegistry = null;
  exerciseArray = null;
}
