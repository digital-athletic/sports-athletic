import { generateHandlerRegistry } from "@test/factories/blockHandlers";
import {
  generateExercisesBlock,
  generatePrescribedBlockResult,
} from "@test/factories/exercisesBlock";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { generateTreeBranch } from "@test/factories/skillTree";
import {
  generateCountedPicksBlock,
  generateShortTemplate,
} from "@test/factories/templateBlock";
import { generateTaggedExercise } from "@test/factories/valueExercise";
import { generateWorkoutInput } from "@test/factories/workoutInput";
import { walkTemplateBlocks } from "../../stages/blockWalk";
import { handlePicksBlock, PICKS_BLOCK_HANDLER } from "./picksHandler";

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
    const block = generateCountedPicksBlock("BAS", 2, "exercises");
    const input = generateWorkoutInput({
      template: generateShortTemplate([block]),
      pickTrees: BAS_SKILL_TREES,
      random: generateSequenceRandom([0.5, 0]),
    });

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
    const block = generateCountedPicksBlock("BAS", 2, "exercises");
    const input = generateWorkoutInput({
      template: generateShortTemplate([block]),
      pickTrees: BAS_SKILL_TREES,
      random: generateSequenceRandom([0]),
    });

    const result = handlePicksBlock(block, input, new Set(["1"]));

    expect(result).toMatchObject({
      status: "filled",
      exercises: [{ branchId: "2", exerciseId: "e2" }],
      usedBranchIds: ["2"],
    });
  });

  it("skips an exercise that an earlier prescribed result lists", () => {
    const block = generateCountedPicksBlock("BAS", 2, "exercises");
    const input = generateWorkoutInput({
      template: generateShortTemplate([block]),
      pickTrees: BAS_SKILL_TREES,
      random: () => 0,
    });
    const earlierResults = [
      generatePrescribedBlockResult(generateExercisesBlock(["e2"])),
    ];

    const result = handlePicksBlock(block, input, new Set(), {
      earlierResults,
      blockPath: "short.blocks[1]",
    });

    expect(result).toMatchObject({
      status: "filled",
      exercises: [{ branchId: "1", exerciseId: "e1x" }],
      usedBranchIds: ["1"],
    });
  });

  it("ends empty without a reason when earlier blocks used every branch", () => {
    const block = generateCountedPicksBlock("BAS", 2, "exercises");
    const input = generateWorkoutInput({
      template: generateShortTemplate([block]),
      pickTrees: BAS_SKILL_TREES,
      random: generateSequenceRandom([]),
    });

    const result = handlePicksBlock(block, input, new Set(["1", "2", "3"]));

    expect(result).toEqual({
      status: "empty",
      block,
      reason: undefined,
      usedBranchIds: [],
    });
  });

  it("draws only from the branches the picks workout rules kept", () => {
    const block = generateCountedPicksBlock("BAS", 2, "exercises");
    const input = generateWorkoutInput({
      template: generateShortTemplate([block]),
      pickTrees: {
        BAS: {
          "1": generateTreeBranch(["e1"], ["GENDER_FEMALE"]),
          "2": generateTreeBranch(["e2"]),
        },
      },
      random: generateSequenceRandom([0]),
    });

    const result = handlePicksBlock(block, input, new Set());

    expect(result).toMatchObject({
      status: "filled",
      exercises: [{ branchId: "2", exerciseId: "e2" }],
    });
  });

  it("pairs a both sided exercise with the both sided partner of the opposite direction", () => {
    const block = generateCountedPicksBlock("PREVKNEE", 1, "pairs");
    const input = generateWorkoutInput({
      template: generateShortTemplate([block]),
      pickTrees: {
        PREV: {
          "1": generateTreeBranch(["e1"]),
          "2": generateTreeBranch(["e2"]),
          "3": generateTreeBranch(["e3"]),
        },
        PREVKG: {},
      },
      exerciseCatalog: [
        generateTaggedExercise("e1", ["SIDE_BOTH", "EXERCISE_DIRECTION_HIP"]),
        generateTaggedExercise("e2", ["SIDE_BOTH"]),
        generateTaggedExercise("e3", ["SIDE_BOTH", "KNEE"]),
      ],
      // the lead, then one draw each for the partner candidates 2 and 3
      random: generateSequenceRandom([0, 0, 0]),
    });

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
    const template = generateShortTemplate([
      generateCountedPicksBlock("BAS", 1, "exercises"),
      generateCountedPicksBlock("BAS", 1, "exercises"),
    ]);
    const input = generateWorkoutInput({
      template,
      pickTrees: BAS_SKILL_TREES,
      random: generateSequenceRandom([0, 0]),
    });
    const handlers = generateHandlerRegistry(undefined, {
      picks: PICKS_BLOCK_HANDLER,
    });

    const results = walkTemplateBlocks(template, input, handlers);

    expect(results.map((result) => result.usedBranchIds)).toEqual([
      ["1"],
      ["2"],
    ]);
  });

  it("throws for a block that workout setup did not resolve", () => {
    const block = generateCountedPicksBlock("BAS", 2, "exercises");

    expect(() =>
      handlePicksBlock(block, generateWorkoutInput(), new Set()),
    ).toThrow("Workout setup resolved no picks block for skill BAS");
  });

  it("shares the used branches across the whole workout", () => {
    expect(PICKS_BLOCK_HANDLER.usedBranchScope).toBe("workout");
    expect(PICKS_BLOCK_HANDLER.handleBlock).toBe(handlePicksBlock);
  });
});
