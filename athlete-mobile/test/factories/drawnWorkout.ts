import type { DrawnWorkout } from "@/features/customWorkouts/drawnWorkout";
import { generateBranchesBlock, generateTemplate } from "./templateBlock";

/**
 * Builds the drawn workout of a template with one drawn block of the branch.
 *
 * generateDrawnWorkout("510")
 * → { templateHash: "00000000", workout: { aiwl: 1, ..., blocks: [{ kind: "branches", skill: "GKS", branches: ["510"], duration: 600 }] } }
 */
export const generateDrawnWorkout = (branchId: string): DrawnWorkout => ({
  templateHash: "00000000",
  workout: generateTemplate([generateBranchesBlock("GKS", [branchId])]),
});
