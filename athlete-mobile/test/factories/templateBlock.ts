import type { Block, Template } from "@/schemas/aiwl.schema";

type BranchesBlock = Extract<Block, { kind: "branches" }>;

/**
 * Builds a branches block as a training day stores it, with a duration of 10
 * minutes unless the overrides say otherwise.
 *
 * generateBranchesBlock("GKS", ["510", "523"])
 * → { kind: "branches", skill: "GKS", branches: ["510", "523"], duration: 600 }
 */
export const generateBranchesBlock = (
  skill = "GKS",
  branches: string[] = ["510"],
  overrides: Partial<BranchesBlock> = {},
): BranchesBlock => ({
  kind: "branches",
  skill,
  branches,
  duration: 600,
  ...overrides,
});

/**
 * Builds a stored cardio block with the duration in seconds, or without one.
 * A cardio tree holds one branch, so the block names it.
 *
 * generateCardioBlock("CARDIO_3", 1500)
 * → { kind: "branches", skill: "CARDIO_3", branches: ["580"], duration: 1500 }
 */
export const generateCardioBlock = (
  skill = "CARDIO_3",
  duration?: number,
): BranchesBlock => generateBranchesBlock(skill, ["580"], { duration });

/**
 * Wraps blocks into an AIWL template.
 *
 * generateTemplate([generateBranchesBlock("GKS", ["510"])])
 * → { aiwl: 1, id: "day", name: { en: "Day" }, blocks: [{ kind: "branches", ... }] }
 */
export const generateTemplate = (
  blocks: Block[] = [generateBranchesBlock()],
): Template => ({
  aiwl: 1,
  id: "day",
  name: { en: "Day" },
  blocks,
});
