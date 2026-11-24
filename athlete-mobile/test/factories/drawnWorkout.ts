import type { DrawnWorkout } from "@/features/customWorkouts/drawnWorkout";
import { generateBranchesBlock, generateTemplate } from "./templateBlock";

/**
 * Builds the drawn workout of a template with one drawn block of the branch,
 * saved while the custom workout had the last change 1 Nov 2026 08:00.
 *
 * generateDrawnWorkout("510")
 * → { templateModifiedAt: "2026-11-01T08:00:00.123456+00:00", workout: { aiwl: 1, ..., blocks: [{ kind: "branches", skill: "GKS", branches: ["510"], duration: 600 }] } }
 */
export const generateDrawnWorkout = (branchId: string): DrawnWorkout => ({
  templateModifiedAt: "2026-11-01T08:00:00.123456+00:00",
  workout: generateTemplate([generateBranchesBlock("GKS", [branchId])]),
});
