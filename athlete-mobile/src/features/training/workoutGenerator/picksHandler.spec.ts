import type { Block, PicksBlock, Template } from "@/schemas/aiwl.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  SkillBranchType,
  SkillTreeType,
} from "@/schemas/skillTree.schema";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { type BlockHandlerRegistry, walkTemplateBlocks } from "./blockWalk";
import type { GenerationInput } from "./generationInput";
import { handlePicksBlock, PICKS_BLOCK_HANDLER } from "./picksHandler";
import { setUpWorkout, type WorkoutInput } from "./workoutSetup";

/**
 * Builds a picks block that draws the given count from every branch of its pool.
 *
 * generatePicksBlock("BAS", 2, "exercises")
 * → { kind: "picks", skill: "BAS", picks: [{ tags: [], count: 2 }], countBy: "exercises" }
 */
const generatePicksBlock = (
  skill: string,
  count: number,
  countBy: PicksBlock["countBy"],
): PicksBlock => ({
  kind: "picks",
  skill,
  picks: [{ tags: [], count }],
  countBy,
});

/**
 * Wraps blocks into an AIWL template.
 *
 * generateTemplate([generatePicksBlock("BAS", 2, "exercises")])
 * → { aiwl: 1, id: "short", name: { en: "Short" }, blocks: [{ kind: "picks", ... }] }
 */
const generateTemplate = (blocks: Block[]): Template => ({
  aiwl: 1,
  id: "short",
  name: { en: "Short" },
  blocks,
});

/**
 * Builds a skill tree branch with one exercise per level, starting at level 1.
 *
 * generateTreeBranch(["e1", "e1x"], ["SIDE_BOTH"])
 * → { tags: ["SIDE_BOTH"], levels: { 1: { exerciseId: "e1" }, 2: { exerciseId: "e1x" } } }
 */
const generateTreeBranch = (
  exerciseIds: string[],
  tags: string[] = [],
): SkillBranchType => ({
  tags,
  levels: Object.fromEntries(
    exerciseIds.map((exerciseId, index) => [index + 1, { exerciseId }]),
  ),
});

/**
 * Builds a catalog exercise with the given tags and no values.
 *
 * generateCatalogExercise("e1", ["SIDE_BOTH"])
 * → { id: "e1", name: "e1", tags: ["SIDE_BOTH"], level: { m: 1, w: 1 }, values: null, ... }
 */
const generateCatalogExercise = (id: string, tags: string[]): ExerciseType => ({
  id,
  level: { m: 1, w: 1 },
  name: id,
  displayName: null,
  description: null,
  picture: null,
  video: null,
  values: null,
  tags,
  isAdvanceByReps: true,
  isAdvanceByDuration: false,
  isJump: false,
});

/**
 * Sets up the workout of the template for an advanced adult man, drawing
 * through the given values.
 *
 * generateWorkoutInput(template, BAS_SKILL_TREES, [0.5, 0])
 * → { athleteLevel: "ADVANCED", picksWorkout: { pool: { 1, 2, 3 }, ... }, ... }
 */
const generateWorkoutInput = (
  template: Template,
  skillTrees: Record<string, SkillTreeType>,
  draws: number[],
  input: GenerationInput = generateRuleFamilyInput(),
): WorkoutInput =>
  setUpWorkout(
    { ...input, random: generateSequenceRandom(draws) },
    template,
    skillTrees,
  );

// At ADVANCED, branch 1 resolves to its level 2 exercise e1x, as branch 3 does.
const BAS_SKILL_TREES = {
  BAS: {
    "1": generateTreeBranch(["e1", "e1x"]),
    "2": generateTreeBranch(["e2"]),
    "3": generateTreeBranch(["e1x"]),
  },
};

describe("picksHandler: handlePicksBlock", () => {
  it("draws through input.random and resolves each branch at the athlete level", () => {
    const block = generatePicksBlock("BAS", 2, "exercises");
    const input = generateWorkoutInput(
      generateTemplate([block]),
      BAS_SKILL_TREES,
      [0.5, 0],
    );

    const result = handlePicksBlock(block, input, new Set());

    expect(result).toEqual({
      status: "filled",
      block,
      exercises: [
        { branchId: "2", branchTags: [], exerciseId: "e2" },
        { branchId: "1", branchTags: [], exerciseId: "e1x" },
      ],
      usedBranchIds: ["2", "1"],
    });
  });

  it("skips the branches and the exercises that earlier blocks used", () => {
    const block = generatePicksBlock("BAS", 2, "exercises");
    const input = generateWorkoutInput(
      generateTemplate([block]),
      BAS_SKILL_TREES,
      [0],
    );

    const result = handlePicksBlock(block, input, new Set(["1"]));

    expect(result).toMatchObject({
      status: "filled",
      exercises: [{ branchId: "2", exerciseId: "e2" }],
      usedBranchIds: ["2"],
    });
  });

  it("ends empty without a reason when earlier blocks used every branch", () => {
    const block = generatePicksBlock("BAS", 2, "exercises");
    const input = generateWorkoutInput(
      generateTemplate([block]),
      BAS_SKILL_TREES,
      [],
    );

    const result = handlePicksBlock(block, input, new Set(["1", "2", "3"]));

    expect(result).toEqual({
      status: "empty",
      block,
      reason: undefined,
      usedBranchIds: [],
    });
  });

  it("draws only from the branches the picks workout rules kept", () => {
    const block = generatePicksBlock("BAS", 2, "exercises");
    const input = generateWorkoutInput(
      generateTemplate([block]),
      {
        BAS: {
          "1": generateTreeBranch(["e1"], ["GENDER_FEMALE"]),
          "2": generateTreeBranch(["e2"]),
        },
      },
      [0],
    );

    const result = handlePicksBlock(block, input, new Set());

    expect(result).toMatchObject({
      status: "filled",
      exercises: [{ branchId: "2", exerciseId: "e2" }],
    });
  });

  it("pairs a both sided exercise with the both sided partner of the opposite direction", () => {
    const block = generatePicksBlock("PREVKNEE", 1, "pairs");
    const input = generateWorkoutInput(
      generateTemplate([block]),
      {
        PREV: {
          "1": generateTreeBranch(["e1"]),
          "2": generateTreeBranch(["e2"]),
          "3": generateTreeBranch(["e3"]),
        },
        PREVKG: {},
      },
      // the lead, then one draw each for the partner candidates 2 and 3
      [0, 0, 0],
      generateRuleFamilyInput({
        exerciseCatalog: [
          generateCatalogExercise("e1", [
            "SIDE_BOTH",
            "EXERCISE_DIRECTION_HIP",
          ]),
          generateCatalogExercise("e2", ["SIDE_BOTH"]),
          generateCatalogExercise("e3", ["SIDE_BOTH", "KNEE"]),
        ],
      }),
    );

    const result = handlePicksBlock(block, input, new Set());

    expect(result).toMatchObject({
      status: "filled",
      exercises: [
        { branchId: "1", exerciseId: "e1" },
        { branchId: "3", exerciseId: "e3" },
      ],
      usedBranchIds: ["1", "3"],
    });
  });

  it("hands a later block the branches and exercises of the blocks before it", () => {
    const template = generateTemplate([
      generatePicksBlock("BAS", 1, "exercises"),
      generatePicksBlock("BAS", 1, "exercises"),
    ]);
    const input = generateWorkoutInput(template, BAS_SKILL_TREES, [0, 0]);
    const handleEmptyBlock = (block: Block) => ({
      status: "empty" as const,
      block,
      reason: undefined,
      usedBranchIds: [],
    });
    const handlers: BlockHandlerRegistry = {
      picks: PICKS_BLOCK_HANDLER,
      branches: { usedBranchScope: "block", handleBlock: handleEmptyBlock },
      duration: { usedBranchScope: "workout", handleBlock: handleEmptyBlock },
    };

    const results = walkTemplateBlocks(template, input, handlers);

    expect(results.map((result) => result.usedBranchIds)).toEqual([
      ["1"],
      ["2"],
    ]);
  });

  it("throws for a block that workout setup did not resolve", () => {
    const block = generatePicksBlock("BAS", 2, "exercises");

    expect(() =>
      handlePicksBlock(
        block,
        setUpWorkout(generateRuleFamilyInput()),
        new Set(),
      ),
    ).toThrow("Workout setup resolved no picks block for skill BAS");
  });

  it("shares the used branches across the whole workout", () => {
    expect(PICKS_BLOCK_HANDLER.usedBranchScope).toBe("workout");
    expect(PICKS_BLOCK_HANDLER.handleBlock).toBe(handlePicksBlock);
  });
});
