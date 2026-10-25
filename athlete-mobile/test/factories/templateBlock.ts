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
