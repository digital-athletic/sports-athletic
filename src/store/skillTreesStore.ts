import { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

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
    branchId: number,
  ) => ExerciseBranchType | undefined;
  getAvailableBranchesForLevel: (
    skillName: string,
    level: number,
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
    immer((set, get) => ({
      skillTrees: {},

      setSkillTree: (skillName, tree) =>
        set((state) => {
          state.skillTrees[skillName] = tree;
        }),

      setAllSkillTrees: (trees) =>
        set((state) => {
          state.skillTrees = trees;
        }),

      clearSkillTrees: () =>
        set((state) => {
          state.skillTrees = {};
        }),

      getSkillTree: (skillName) => {
        const { skillTrees } = get();
        return skillTrees[skillName];
      },

      getBranchById: (skillName, branchId) => {
        const tree = get().getSkillTree(skillName);
        return tree?.branches.find(
          (branch) => branch.exerciseBranchId === branchId,
        );
      },

      getAvailableBranchesForLevel: (skillName, level) => {
        const tree = get().getSkillTree(skillName);
        return tree?.branches.filter((branch) => branch.exercises[level]) ?? [];
      },
    })),
    {
      name: "skill-trees-storage",
      storage: asyncStorage,
    },
  ),
);
