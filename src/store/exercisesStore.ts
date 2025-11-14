import { create } from "zustand";
import { persist } from "zustand/middleware";
import { asyncStorage } from "./middleware";

export type SkillType =
  | "PREVENTION"
  | "MOBILITY"
  | "SWR"
  | "WARMUP"
  | "STABILITY"
  | "CARDIO";

export interface ExerciseType {
  id: number;
  name: string;
  description: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  difficulty: number;
  equipment: string[];
  muscleGroups: string[];
  tags: string[];
  skill: SkillType;
}

export interface ExercisesState {
  exercises: ExerciseType[] | null;

  // Actions
  setExercises: (exercises: ExerciseType[]) => void;
  clearExercises: () => void;

  // Selectors
  getExerciseById: (id: number) => ExerciseType | undefined;
  getExercisesBySkill: (skill: SkillType) => ExerciseType[];
  getExercisesByTag: (tag: string) => ExerciseType[];
  getExercisesByEquipment: (equipment: string[]) => ExerciseType[];
}

/**
 * Exercises Store
 *
 * Manages the exercise database.
 * Central repository for all exercise definitions used throughout the app.
 *
 * Note: Consider migrating to React Query for server-side fetching in the future.
 *
 * @example
 * ```tsx
 * const { exercises, getExerciseById, getExercisesBySkill } = useExercisesStore();
 *
 * // Get a specific exercise
 * const exercise = getExerciseById(42);
 *
 * // Get all prevention exercises
 * const preventionExercises = getExercisesBySkill('PREVENTION');
 *
 * // Filter by available equipment
 * const homeExercises = getExercisesByEquipment(['BODYWEIGHT', 'MAT']);
 * ```
 */
export const useExercisesStore = create<ExercisesState>()(
  persist(
    (set, get) => ({
      exercises: null,

      setExercises: (exercises) => set({ exercises }),

      clearExercises: () => set({ exercises: null }),

      getExerciseById: (id) => {
        const { exercises } = get();
        return exercises?.find((exercise) => exercise.id === id);
      },

      getExercisesBySkill: (skill) => {
        const { exercises } = get();
        return exercises?.filter((exercise) => exercise.skill === skill) ?? [];
      },

      getExercisesByTag: (tag) => {
        const { exercises } = get();
        return (
          exercises?.filter((exercise) => exercise.tags.includes(tag)) ?? []
        );
      },

      getExercisesByEquipment: (equipment) => {
        const { exercises } = get();
        if (!exercises) return [];

        return exercises.filter((exercise) =>
          exercise.equipment.every((eq) => equipment.includes(eq))
        );
      },
    }),
    {
      name: "exercises-storage",
      storage: asyncStorage,
    }
  )
);
