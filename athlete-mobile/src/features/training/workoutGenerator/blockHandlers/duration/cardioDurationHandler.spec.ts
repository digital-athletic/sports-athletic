import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { loadExercises } from "@/data/loadExercises";
import { generateFilledBlockResult } from "@test/factories/blockResult";
import {
  generateSkillBranch,
  generateTreeBranch,
} from "@test/factories/skillTree";
import { catchThrownValue } from "@test/factories/thrownValue";
import { generateMixedExerciseCatalog } from "@test/factories/valueExercise";
import { generateWorkoutInput } from "@test/factories/workoutInput";
import type { BranchesBlock } from "../../stages/blockWalk";
import { createBranchesBlockHandler } from "../branches/branchesHandler";
import { lookUpStoredBranchInCatalog } from "../branches/storedBranchLookup";
import { createCardioDurationHandler } from "./cardioDurationHandler";

const NO_BRANCHES = new Set<string>();
const cardioBlock = {
  kind: "duration",
  skill: "CARDIO_2",
  duration: 1200,
} as const;

/**
 * Builds a CARDIO_2 tree of three branches: branch "1" blocked on knee pain,
 * branches "2" and "3" without tags.
 *
 * generateKneeBlockedCardioTree()
 * → { "1": { tags: ["BLOCK_KNEE"], ... }, "2": { tags: [], ... }, "3": { tags: [], ... } }
 */
const generateKneeBlockedCardioTree = () => ({
  "1": generateTreeBranch(["e1"], ["BLOCK_KNEE"]),
  "2": generateTreeBranch(["e2"]),
  "3": generateTreeBranch(["e3"]),
});

/**
 * Builds a branches handler that records the block it receives and fills it.
 *
 * const received: BranchesBlock[] = [];
 * generateRecordingBranchesHandler(received)
 * → a handler that pushes each block onto received and returns a filled result
 */
const generateRecordingBranchesHandler =
  (received: BranchesBlock[]) => (block: BranchesBlock) => {
    received.push(block);
    return generateFilledBlockResult(block, block.branches);
  };

describe("cardioDurationHandler: createCardioDurationHandler", () => {
  it("draws the last allowed branch of the tree when the random source returns a high value", () => {
    const received: BranchesBlock[] = [];
    const handleBlock = createCardioDurationHandler(
      generateRecordingBranchesHandler(received),
    );
    const input = generateWorkoutInput({
      pains: ["KNEE_LEFT"],
      exerciseCatalog: generateMixedExerciseCatalog(),
      skillTrees: { CARDIO_2: generateKneeBlockedCardioTree() },
      random: () => 0.99,
    });

    handleBlock(cardioBlock, input, NO_BRANCHES);

    expect(received.map(({ branches }) => branches)).toEqual([["3"]]);
  });

  // a draw over all three branches would return the blocked branch "1" for 0
  it("draws the first allowed branch of the tree when the random source returns zero", () => {
    const received: BranchesBlock[] = [];
    const handleBlock = createCardioDurationHandler(
      generateRecordingBranchesHandler(received),
    );
    const input = generateWorkoutInput({
      pains: ["KNEE_LEFT"],
      exerciseCatalog: generateMixedExerciseCatalog(),
      skillTrees: { CARDIO_2: generateKneeBlockedCardioTree() },
      random: () => 0,
    });

    handleBlock(cardioBlock, input, NO_BRANCHES);

    expect(received.map(({ branches }) => branches)).toEqual([["2"]]);
  });

  it("hands the branches handler a branches block that keeps the skill and the duration", () => {
    const received: BranchesBlock[] = [];
    const handleBlock = createCardioDurationHandler(
      generateRecordingBranchesHandler(received),
    );
    const input = generateWorkoutInput({
      exerciseCatalog: generateMixedExerciseCatalog(),
      skillTrees: { CARDIO_2: { "2": generateTreeBranch(["e2"]) } },
    });

    handleBlock(cardioBlock, input, NO_BRANCHES);

    expect(received).toEqual([
      { kind: "branches", skill: "CARDIO_2", branches: ["2"], duration: 1200 },
    ]);
  });

  it("throws a SKILL_TREE error naming the skill when the tree has no branch with levels", () => {
    const handleBlock = createCardioDurationHandler(
      generateRecordingBranchesHandler([]),
    );
    const input = generateWorkoutInput({
      exerciseCatalog: generateMixedExerciseCatalog(),
      skillTrees: { CARDIO_2: { "1": generateSkillBranch([], {}) } },
    });

    expect(
      catchThrownValue(() => handleBlock(cardioBlock, input, NO_BRANCHES)),
    ).toEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: ["CARDIO_2"],
    });
  });

  // pain blocks every CARDIO_2 branch, so the branches handler swaps the block instead of throwing PAIN
  it("swaps the block for the CARDIO_5 run when pain blocks every branch of the tree", () => {
    const handleBlock = createCardioDurationHandler(
      createBranchesBlockHandler(lookUpStoredBranchInCatalog),
    );
    const input = generateWorkoutInput({
      pains: ["KNEE_LEFT"],
      exerciseCatalog: loadExercises(),
      skillTrees: {
        ...getAllSkillTrees(),
        CARDIO_2: {
          "990001": generateTreeBranch(["42"], ["BLOCK_KNEE"]),
          "990002": generateTreeBranch(["42"], ["BLOCK_KNEE"]),
        },
      },
    });

    const result = handleBlock(cardioBlock, input, NO_BRANCHES);

    expect(result).toMatchObject({
      status: "filled",
      block: { skill: "CARDIO_5", branches: ["576"] },
      swappedFromSkill: "CARDIO_2",
    });
  });

  it("draws from every branch of the tree when the pain filter is off", () => {
    const received: BranchesBlock[] = [];
    const handleBlock = createCardioDurationHandler(
      generateRecordingBranchesHandler(received),
    );
    const input = generateWorkoutInput({
      pains: ["KNEE_LEFT"],
      exerciseCatalog: generateMixedExerciseCatalog(),
      skillTrees: { CARDIO_2: generateKneeBlockedCardioTree() },
      random: () => 0,
      filters: { pain: false },
    });

    handleBlock(cardioBlock, input, NO_BRANCHES);

    expect(received.map(({ branches }) => branches)).toEqual([["1"]]);
  });

  it("swaps the block for the CARDIO_5 run for lower body soreness", () => {
    const handleBlock = createCardioDurationHandler(
      createBranchesBlockHandler(lookUpStoredBranchInCatalog),
    );
    const input = generateWorkoutInput({
      soreMuscles: ["QUADRICEPS"],
      exerciseCatalog: loadExercises(),
      skillTrees: getAllSkillTrees(),
    });

    const result = handleBlock(cardioBlock, input, NO_BRANCHES);

    expect(result).toMatchObject({
      status: "filled",
      block: { skill: "CARDIO_5" },
      swappedFromSkill: "CARDIO_2",
    });
  });

  it("keeps the cardio zone for lower body soreness when the soreness filter is off", () => {
    const handleBlock = createCardioDurationHandler(
      createBranchesBlockHandler(lookUpStoredBranchInCatalog),
    );
    const input = generateWorkoutInput({
      soreMuscles: ["QUADRICEPS"],
      exerciseCatalog: loadExercises(),
      skillTrees: getAllSkillTrees(),
      filters: { soreness: false },
    });

    const result = handleBlock(cardioBlock, input, NO_BRANCHES);

    expect(result).toMatchObject({
      status: "filled",
      block: { skill: "CARDIO_2", duration: 1200 },
    });
    expect(result).not.toHaveProperty("swappedFromSkill");
  });
});
