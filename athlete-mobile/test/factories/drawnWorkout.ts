import type { DrawnWorkout } from "@/features/customWorkouts/drawnWorkout";
import { generateBranchesBlock } from "./templateBlock";

/**
 * Builds the drawn workout of a template with one drawn block of the branch.
 *
 * generateDrawnWorkout("510")
 * → { templateBlocks: "[]", drawnBlocks: [{ block: { kind: "branches", skill: "GKS", branches: ["510"], duration: 600 }, templateIndex: 0 }] }
 */
export const generateDrawnWorkout = (branchId: string): DrawnWorkout => ({
  templateBlocks: "[]",
  drawnBlocks: [
    { block: generateBranchesBlock("GKS", [branchId]), templateIndex: 0 },
  ],
});
