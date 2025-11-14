import { create } from "zustand";
import { persist } from "zustand/middleware";
import { asyncStorage } from "./middleware";
import type { ExerciseBranchType } from "./userWorkoutStore";

export interface SkillTreeType {
  name: string;
  branches: ExerciseBranchType[];
}

export interface SkillTreesState {
  skillTrees: Record<string, SkillTreeType>;

  // Actions
  setSkillTree: (skillName: string, tree: SkillTreeType) => void;
  setAllSkillTrees: (trees: Record<string, SkillTreeType>) => void;
  clearSkillTrees: () => void;

  // Selectors
  getSkillTree: (skillName: string) => SkillTreeType | undefined;
  getBranchById: (
    skillName: string,
    branchId: number
  ) => ExerciseBranchType | undefined;
  getAvailableBranchesForLevel: (
    skillName: string,
    level: number
  ) => ExerciseBranchType[];
}

/**
 * Skill Trees Store
 *
 * Manages skill progression trees for exercise planning.
 * Each skill (e.g., PREVENTION, MOBILITY) has a tree structure with branches
 * representing different exercise progressions.
 *
 * @example
 * ```tsx
 * const { skillTrees, getSkillTree, getAvailableBranchesForLevel } = useSkillTreesStore();
 *
 * // Get a specific skill tree
 * const preventionTree = getSkillTree('PREVENTION');
 *
 * // Get branches available at a specific level
 * const level2Branches = getAvailableBranchesForLevel('MOBILITY', 2);
 *
 * // Update a skill tree
 * setSkillTree('PREVENTION', {
 *   name: 'PREVENTION',
 *   branches: [...],
 * });
 * ```
 */
export const useSkillTreesStore = create<SkillTreesState>()(
  persist(
    (set, get) => ({
      skillTrees: {},

      setSkillTree: (skillName, tree) =>
        set((state) => ({
          skillTrees: {
            ...state.skillTrees,
            [skillName]: tree,
          },
        })),

      setAllSkillTrees: (trees) => set({ skillTrees: trees }),

      clearSkillTrees: () => set({ skillTrees: {} }),

      getSkillTree: (skillName) => {
        const { skillTrees } = get();
        return skillTrees[skillName];
      },

      getBranchById: (skillName, branchId) => {
        const tree = get().getSkillTree(skillName);
        return tree?.branches.find((branch) => branch.id === branchId);
      },

      getAvailableBranchesForLevel: (skillName, level) => {
        const tree = get().getSkillTree(skillName);
        return tree?.branches.filter((branch) => branch.level === level) ?? [];
      },
    }),
    {
      name: "skill-trees-storage",
      storage: asyncStorage,
    }
  )
);
