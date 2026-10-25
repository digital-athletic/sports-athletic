import type { Block, PicksBlock, Template } from "@/schemas/aiwl.schema";

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
 * Builds a branches block of branch "1" without a duration, so the timing of
 * the skill catalog entry applies. The overrides replace any field.
 *
 * generateUntimedBranchesBlock("GKS", { sets: 3 })
 * → { kind: "branches", skill: "GKS", branches: ["1"], duration: undefined, sets: 3 }
 */
export const generateUntimedBranchesBlock = (
  skill: string,
  overrides: Partial<BranchesBlock> = {},
): BranchesBlock =>
  generateBranchesBlock(skill, ["1"], { duration: undefined, ...overrides });

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
 * Builds a short workout block that draws one branch from the whole tree of
 * its skill, without values of its own. The overrides replace any field.
 *
 * generatePicksBlock("BAS", { sets: 5 })
 * → { kind: "picks", skill: "BAS", picks: [{ tags: [], count: 1 }], sets: 5 }
 */
export const generatePicksBlock = (
  skill = "BAS",
  overrides: Partial<PicksBlock> = {},
): PicksBlock => ({
  kind: "picks",
  skill,
  picks: [{ tags: [], count: 1 }],
  ...overrides,
});

/**
 * Builds a picks block that draws the given count from every branch of its
 * pool.
 *
 * generateCountedPicksBlock("BAS", 2, "exercises")
 * → { kind: "picks", skill: "BAS", picks: [{ tags: [], count: 2 }], countBy: "exercises" }
 */
export const generateCountedPicksBlock = (
  skill: string,
  count: number,
  countBy: PicksBlock["countBy"],
): PicksBlock =>
  generatePicksBlock(skill, { picks: [{ tags: [], count }], countBy });

/**
 * Wraps blocks into an AIWL template. The overrides replace any field of it.
 *
 * generateTemplate([generateBranchesBlock("GKS", ["510"])])
 * → { aiwl: 1, id: "day", name: { en: "Day" }, blocks: [{ kind: "branches", ... }] }
 */
export const generateTemplate = (
  blocks: Block[] = [generateBranchesBlock()],
  overrides: Partial<Template> = {},
): Template => ({
  aiwl: 1,
  id: "day",
  name: { en: "Day" },
  blocks,
  ...overrides,
});

/**
 * Wraps blocks into the AIWL template of a short workout.
 *
 * generateShortTemplate([generatePicksBlock("WU")])
 * → { aiwl: 1, id: "short", name: { en: "Short" }, blocks: [{ kind: "picks", ... }] }
 */
export const generateShortTemplate = (blocks: Block[]): Template =>
  generateTemplate(blocks, { id: "short", name: { en: "Short" } });
