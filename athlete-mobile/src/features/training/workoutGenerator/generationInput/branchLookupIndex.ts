import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type {
  SkillBranchType,
  SkillTreeType,
} from "@/schemas/skillTree.schema";

export interface IndexedBranch {
  readonly branchId: string;
  readonly skillTreeName: string;
  readonly branch: SkillBranchType;
}

export type BranchLookupIndex = ReadonlyMap<string, IndexedBranch>;

/**
 * Maps every branch ID to its branch across all skill trees. Plan slots store
 * branches of other trees than their skill's own, so the index spans all trees.
 */
export const buildBranchLookupIndex = (
  skillTrees: Readonly<Record<string, SkillTreeType>>,
): BranchLookupIndex => {
  const index = new Map<string, IndexedBranch>();
  for (const [skillTreeName, skillTree] of Object.entries(skillTrees)) {
    for (const [branchId, branch] of Object.entries(skillTree)) {
      const indexedBranch = index.get(branchId);
      if (indexedBranch) {
        throw new Error(
          `Branch ID ${branchId} appears in the skill trees ${indexedBranch.skillTreeName} and ${skillTreeName}`,
        );
      }
      index.set(branchId, { branchId, skillTreeName, branch });
    }
  }
  return index;
};

let loadedBranchLookupIndex: BranchLookupIndex | undefined;

export const loadBranchLookupIndex = (): BranchLookupIndex => {
  loadedBranchLookupIndex ??= buildBranchLookupIndex(getAllSkillTrees());
  return loadedBranchLookupIndex;
};
