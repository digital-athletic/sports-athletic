import type { SavedVersion } from "@/features/customWorkouts/savedVersion";
import { generateBranchesBlock } from "./templateBlock";

/**
 * Builds the version of a template with one saved block of the branch.
 *
 * generateSavedVersion("510")
 * → { templateBlocks: "[]", blocks: [{ block: { kind: "branches", skill: "GKS", branches: ["510"], duration: 600 }, templateIndex: 0 }] }
 */
export const generateSavedVersion = (branchId: string): SavedVersion => ({
  templateBlocks: "[]",
  blocks: [
    { block: generateBranchesBlock("GKS", [branchId]), templateIndex: 0 },
  ],
});
