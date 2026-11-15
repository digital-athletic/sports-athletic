import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { Block, Template } from "@/schemas/aiwl.schema";

type BranchesBlock = Extract<Block, { kind: "branches" }>;

const listSessionBranchIds = (
  session: readonly UserExerciseDataType[],
  skill: string,
): string[] => {
  const branchIds = new Set<string>();
  for (const entry of session) {
    if (entry.skill !== skill) continue;
    if (!entry.branchId || isPlaceholderBranch(entry.branchId)) continue;
    branchIds.add(entry.branchId);
  }
  return [...branchIds];
};

const freezeBlock = (
  block: Block,
  branches: string[],
): BranchesBlock | null => {
  if (block.kind !== "picks" && block.kind !== "branches") return null;
  if (branches.length === 0) return null;
  const { superset, sets, setDuration, values, rest } = block;
  return {
    kind: "branches",
    skill: block.skill,
    ...(superset !== undefined && { superset }),
    ...(sets !== undefined && { sets }),
    ...(setDuration !== undefined && { setDuration }),
    ...(values !== undefined && { values }),
    ...(rest !== undefined && { rest }),
    branches,
  };
};

/**
 * Freezes a drawn short workout into a template of branches blocks, so the
 * plan swap machinery can regenerate it. A block keeps its timing and lists
 * the branches the session drew for its skill. Blocks that share a skill,
 * hold no session branch or are no picks or branches block are dropped.
 *
 * freezeShortWorkout(template, session)
 * → { aiwl: 1, id, name, blocks: [{ kind: "branches", skill: "BAS", branches: ["12", "10"] }] }
 */
export const freezeShortWorkout = (
  template: Template,
  session: readonly UserExerciseDataType[],
): Template => ({
  aiwl: template.aiwl,
  id: template.id,
  name: template.name,
  blocks: template.blocks.flatMap((block) => {
    const sharesSkill =
      template.blocks.filter(({ skill }) => skill === block.skill).length > 1;
    if (sharesSkill) return [];
    const frozen = freezeBlock(
      block,
      listSessionBranchIds(session, block.skill),
    );
    return frozen ? [frozen] : [];
  }),
});
