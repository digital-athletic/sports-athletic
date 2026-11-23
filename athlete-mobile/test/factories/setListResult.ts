import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { FinishedWorkout } from "@/features/training/workoutGenerator/stages/workoutFinish";
import type { Template } from "@/schemas/aiwl.schema";
import { generateFilledBlockResult } from "./blockResult";

/**
 * Builds what the generator returns when the first block of the template drew
 * the branch.
 *
 * generateSetListResult(template, "510")
 * → { blocks: [<filled result of 510>], setList: [{ branchId: "510", exerciseId: "exercise510", set: [1, 1], skill: "GKS" }] }
 */
export const generateSetListResult = (
  template: Template,
  branchId: string,
): FinishedWorkout<GeneratedSetListEntry> => ({
  blocks: [generateFilledBlockResult(template.blocks[0], [branchId])],
  setList: [
    { branchId, exerciseId: `exercise${branchId}`, set: [1, 1], skill: "GKS" },
  ],
});
