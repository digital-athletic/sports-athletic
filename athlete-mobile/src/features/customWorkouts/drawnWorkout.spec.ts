import type { BranchesBlock } from "@/features/training/workoutGenerator/stages/blockWalk";
import type { Block } from "@/schemas/aiwl.schema";
import {
  generateBlockResult,
  generateFilledBlockResult,
} from "@test/factories/blockResult";
import { generateBranchReference } from "@test/factories/branchReference";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { readDrawnBlocks } from "./drawnWorkout";

describe("drawnWorkout: readDrawnBlocks", () => {
  it("reads the distinct branch IDs of a block in draw order", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const result = generateBlockResult("filled", {
      block: template.blocks[0] as ReturnType<typeof generatePicksBlock>,
      exercises: [
        generateBranchReference("523"),
        generateBranchReference("510"),
        generateBranchReference("510"),
        generateBranchReference("520"),
      ],
    });

    const blocks = readDrawnBlocks({ blocks: [result], setList: [] });

    expect(blocks.map((block) => block.branches)).toEqual([
      ["523", "510", "520"],
    ]);
  });

  it.each<[string, Block, BranchesBlock]>([
    [
      "copies the timing fields of a picks block",
      generatePicksBlock("GKS", {
        picks: [{ tags: [], count: 1 }],
        sets: 4,
        setDuration: 40,
        values: "exercise",
        rest: { withinSuperset: 10, betweenSets: 45, afterExercise: 60 },
        superset: "drawOrder",
      }),
      {
        kind: "branches",
        skill: "GKS",
        branches: ["510"],
        sets: 4,
        setDuration: 40,
        values: "exercise",
        rest: { withinSuperset: 10, betweenSets: 45, afterExercise: 60 },
        superset: "drawOrder",
        pickedFrom: { picks: [{ tags: [], count: 1 }] },
      },
    ],
    [
      "copies no picks setting other than the timing fields",
      generatePicksBlock("GKS", {
        picks: [{ tags: [], count: 1 }],
        countBy: "pairs",
        fallbackToWholeTree: false,
        order: "asDrawn",
      }),
      {
        kind: "branches",
        skill: "GKS",
        branches: ["510"],
        pickedFrom: {
          picks: [{ tags: [], count: 1 }],
          fallbackToWholeTree: false,
        },
      },
    ],
    [
      "copies the duration of a branches block and omits pickedFrom",
      generateBranchesBlock("CARDIO_2", ["510"], { duration: 1500 }),
      {
        kind: "branches",
        skill: "CARDIO_2",
        branches: ["510"],
        duration: 1500,
      },
    ],
  ])("%s", (_name, block, expected) => {
    const blocks = readDrawnBlocks({
      blocks: [generateFilledBlockResult(block, ["510"])],
      setList: [],
    });

    expect(blocks).toStrictEqual([expected]);
  });

  it("skips a block without branches", () => {
    const template = generateTemplate([
      generatePicksBlock("MOB"),
      generatePicksBlock("GKS"),
    ]);
    const emptyBlock = generateBlockResult("filled", {
      block: template.blocks[0] as ReturnType<typeof generatePicksBlock>,
      exercises: [],
    });

    const blocks = readDrawnBlocks({
      blocks: [
        emptyBlock,
        generateFilledBlockResult(template.blocks[1], ["510"]),
      ],
      setList: [],
    });

    expect(blocks.map((block) => block.skill)).toEqual(["GKS"]);
  });
});
