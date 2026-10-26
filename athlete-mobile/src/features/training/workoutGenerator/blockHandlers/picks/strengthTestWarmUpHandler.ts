import { TagGroups } from "@/constants/tagGroups";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { BlockPick, BlockPicks } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues } from "@/utils/tagUtils";
import { filterBranchesByAgeGroup } from "../../ruleFamilies/ageGroupRule";
import { filterBranchesByGender } from "../../ruleFamilies/genderRule";
import type { BlockHandlerRegistry } from "../../stages/blockWalk";
import type { WorkoutInput } from "../../stages/workoutSetup";
import { resolveBranchExerciseId } from "../library/branchResolution";

interface WarmUpDraw {
  pool: SkillTreeType;
  input: WorkoutInput;
  usedBranchIds: string[];
  exercises: BranchExerciseReference[];
}

const resolveWarmUpExerciseId = (
  branchId: string,
  { pool, input }: WarmUpDraw,
): string | null => {
  const { branchData } = input.exerciseData;
  return resolveBranchExerciseId(
    pool[branchId],
    input.athleteLevel,
    Object.hasOwn(branchData, branchId) ? branchData[branchId] : undefined,
  );
};

// A branch without a level stays drawable, as in the old warm-up.
const listUnusedBranchIds = (draw: WarmUpDraw): string[] => {
  const drawnExerciseIds = draw.exercises.map(({ exerciseId }) => exerciseId);
  return Object.keys(draw.pool).filter((branchId) => {
    if (draw.usedBranchIds.includes(branchId)) return false;
    const exerciseId = resolveWarmUpExerciseId(branchId, draw);
    return exerciseId === null || !drawnExerciseIds.includes(exerciseId);
  });
};

const isInPickRegion = (branchTags: readonly string[], pick: BlockPick) =>
  pick.tags.length === 0 ||
  getTagValues(branchTags, TagGroups.REGION).some((region) =>
    pick.tags.includes(region),
  );

// Returns false when no branch is left to draw.
const drawWarmUpBranch = (draw: WarmUpDraw, pick: BlockPick): boolean => {
  const unused = listUnusedBranchIds(draw);
  if (unused.length === 0) return false;
  const inRegion = unused.filter((branchId) =>
    isInPickRegion(draw.pool[branchId].tags, pick),
  );
  const possible = inRegion.length > 0 ? inRegion : unused;
  const branchId = possible[Math.floor(draw.input.random() * possible.length)];
  draw.usedBranchIds.push(branchId);
  const exerciseId = resolveWarmUpExerciseId(branchId, draw);
  if (
    exerciseId !== null &&
    draw.input.exerciseCatalog.some(({ id }) => id === exerciseId)
  ) {
    draw.exercises.push({
      branchId,
      branchTags: draw.pool[branchId].tags,
      exerciseId,
    });
  }
  return true;
};

// A drawn branch whose exercise the catalog lacks counts as used, and the
// pick draws again.
const drawWarmUpPicks = (draw: WarmUpDraw, picks: BlockPicks): void => {
  for (const pick of picks) {
    let drawn = 0;
    while (drawn < pick.count) {
      const exerciseCount = draw.exercises.length;
      if (!drawWarmUpBranch(draw, pick)) return;
      if (draw.exercises.length > exerciseCount) drawn++;
    }
  }
};

/**
 * The picks handler of the strength test warm-up. Each pick names body
 * regions; the handler draws its count from the skill tree of the block,
 * filtered by age group and gender only, never repeating a branch or a
 * resolved exercise. A pick without a matching branch draws from every unused
 * branch. A block that draws no exercise is empty with a SKILL_TREE reason.
 *
 * createStrengthTestWarmUpHandler({ WU: tree }).handleBlock(
 *   { kind: "picks", skill: "WU", picks: [{ tags: ["LOWER_BODY"], count: 1 }] }, input, new Set())
 * → { status: "filled", exercises: [{ branchId: "431", exerciseId: "431", ... }], usedBranchIds: ["431"] }
 */
export const createStrengthTestWarmUpHandler = (
  skillTrees: Readonly<Record<string, SkillTreeType>>,
): BlockHandlerRegistry["picks"] => ({
  usedBranchScope: "workout",
  handleBlock: (block, input) => {
    const tree = skillTrees[block.skill] ?? {};
    const draw: WarmUpDraw = {
      pool: filterBranchesByGender(
        filterBranchesByAgeGroup(tree, input).keep,
        input,
      ).keep,
      input,
      usedBranchIds: [],
      exercises: [],
    };
    drawWarmUpPicks(
      draw,
      Array.isArray(block.picks)
        ? block.picks
        : block.picks[input.hasWeights ? "withWeights" : "withoutWeights"],
    );
    return draw.exercises.length > 0
      ? {
          status: "filled",
          block,
          exercises: draw.exercises,
          usedBranchIds: draw.usedBranchIds,
        }
      : {
          status: "empty",
          block,
          reason: {
            type: "NO_EXERCISES",
            subtype: "SKILL_TREE",
            params: [block.skill],
          },
          usedBranchIds: draw.usedBranchIds,
        };
  },
});
