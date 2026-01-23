import { SharedConstants } from "@/constants/sharedConstants";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

type State = {
  skillTrees: Record<string, SkillTreeType>;
};

const createInitialState = (): State => ({
  skillTrees: {},
});

type Actions = {
  setSkillTree: (skillName: string, tree: SkillTreeType) => void;
  setAllSkillTrees: (trees: Record<string, SkillTreeType>) => void;
  clearSkillTrees: () => void;
};

type Selectors = {
  getSkillTree: (skillName: string) => SkillTreeType | undefined;
};

export type SkillTreesState = State & Actions & Selectors;

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
      ...createInitialState(),

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
    })),
    {
      name: "skill-trees-storage",
      storage: asyncStorage,
      version: SharedConstants.PERSIST_VERSION,
      migrate: (persistedState, version) =>
        version < SharedConstants.PERSIST_VERSION
          ? createInitialState()
          : persistedState,
    },
  ),
);
