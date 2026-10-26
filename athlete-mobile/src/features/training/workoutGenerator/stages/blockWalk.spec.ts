import { generateHandlerRegistry } from "@test/factories/blockHandlers";
import {
  generateEmptyBlockResult,
  generateFilledBlockResult,
} from "@test/factories/blockResult";
import {
  generateExercisesBlock,
  generatePrescribedBlockResult,
  generateWorkoutWithExercises,
} from "@test/factories/exercisesBlock";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { generateWorkoutInput } from "@test/factories/workoutInput";
import { type BlockHandlerRegistry, walkTemplateBlocks } from "./blockWalk";

describe("blockWalk: walkTemplateBlocks", () => {
  it("hands each block to the handler of its kind in template order and draws in that order", () => {
    const template = generateTemplate([
      generateBranchesBlock("SWR2KG", ["79"]),
      generatePicksBlock("WU", { picks: [{ tags: ["SKILL_WU"], count: 2 }] }),
      generateBranchesBlock("GKS", ["510"]),
      { kind: "duration", skill: "MOB", duration: 300 },
    ]);
    const draws = [0.2, 0.4, 0.6, 0.8];
    const input = generateWorkoutInput({ random: () => draws.shift() ?? 0 });
    const visits: string[] = [];
    const handlers = generateHandlerRegistry((block, blockInput) => {
      visits.push(`${block.kind} ${block.skill} ${blockInput.random()}`);
      return generateFilledBlockResult(block, []);
    });

    const results = walkTemplateBlocks(template, input, handlers);

    expect(visits).toEqual([
      "branches SWR2KG 0.2",
      "picks WU 0.4",
      "branches GKS 0.6",
      "duration MOB 0.8",
    ]);
    expect(results.map((result) => result.block)).toEqual(template.blocks);
  });

  it("threads used branches of every earlier block to workout scope blocks and starts each block scope block empty", () => {
    const template = generateTemplate([
      generatePicksBlock("WU", { picks: [{ tags: ["SKILL_WU"], count: 2 }] }),
      generateBranchesBlock("GKS", ["510", "523"]),
      generatePicksBlock("BR", { picks: [{ tags: ["SKILL_BR"], count: 1 }] }),
      generateBranchesBlock("SWR2KG", ["79"]),
      generatePicksBlock("MOB", { picks: [{ tags: ["SKILL_MOB"], count: 1 }] }),
      generatePicksBlock("CD", { picks: [{ tags: ["SKILL_CD"], count: 1 }] }),
    ]);
    const drawnBySkill: Record<string, string[]> = {
      WU: ["11", "12"],
      BR: ["14"],
      MOB: ["13"],
    };
    const receivedBySkill: Record<string, string[]> = {};
    const handlers: BlockHandlerRegistry = {
      picks: {
        usedBranchScope: "workout",
        handleBlock: (block, _input, usedBranches) => {
          receivedBySkill[block.skill] = [...usedBranches];
          const drawn = drawnBySkill[block.skill] ?? [];
          // BR draws a branch and still ends empty
          return block.skill === "BR"
            ? generateEmptyBlockResult(block, undefined, drawn)
            : generateFilledBlockResult(block, drawn);
        },
      },
      branches: {
        usedBranchScope: "block",
        handleBlock: (block, _input, usedBranches) => {
          receivedBySkill[block.skill] = [...usedBranches];
          return generateFilledBlockResult(block, block.branches);
        },
      },
      duration: {
        usedBranchScope: "workout",
        handleBlock: (block) => generateFilledBlockResult(block, []),
      },
      exercises: {
        usedBranchScope: "workout",
        handleBlock: (block) => generateEmptyBlockResult(block),
      },
    };

    walkTemplateBlocks(template, generateWorkoutInput(), handlers);

    expect(receivedBySkill).toEqual({
      WU: [],
      GKS: [],
      BR: ["11", "12", "510", "523"],
      SWR2KG: [],
      MOB: ["11", "12", "510", "523", "14", "79"],
      CD: ["11", "12", "510", "523", "14", "79", "13"],
    });
  });

  it("hands a workout scope block the branches of an earlier block scope block", () => {
    const template = generateTemplate([
      generateBranchesBlock("GKS", ["510"]),
      generatePicksBlock("MOB", { picks: [{ tags: ["SKILL_MOB"], count: 1 }] }),
    ]);
    let receivedByPicks: string[] = [];
    const handlers: BlockHandlerRegistry = {
      picks: {
        usedBranchScope: "workout",
        handleBlock: (block, _input, usedBranches) => {
          receivedByPicks = [...usedBranches];
          return generateFilledBlockResult(block, []);
        },
      },
      branches: {
        usedBranchScope: "block",
        handleBlock: (block) =>
          generateFilledBlockResult(block, block.branches),
      },
      duration: {
        usedBranchScope: "workout",
        handleBlock: (block) => generateFilledBlockResult(block, []),
      },
      exercises: {
        usedBranchScope: "workout",
        handleBlock: (block) => generateEmptyBlockResult(block),
      },
    };

    walkTemplateBlocks(template, generateWorkoutInput(), handlers);

    expect(receivedByPicks).toEqual(["510"]);
  });

  it("hands each block the results of the blocks before it, whatever the used branch scope", () => {
    const template = generateTemplate([
      generateBranchesBlock("GKS", ["510"]),
      generateBranchesBlock("SWR2KG", ["79"]),
      generateBranchesBlock("CD", ["12"]),
    ]);
    const earlierSkills: Record<string, string[]> = {};
    const handlers = generateHandlerRegistry(
      (block, _input, _usedBranches, walk) => {
        earlierSkills[block.skill] = (walk?.earlierResults ?? []).map(
          (result) => result.block.skill,
        );
        return generateFilledBlockResult(block, []);
      },
    );

    walkTemplateBlocks(template, generateWorkoutInput(), handlers);

    expect(earlierSkills).toEqual({
      GKS: [],
      SWR2KG: ["GKS"],
      CD: ["GKS", "SWR2KG"],
    });
  });

  it("hands an exercises block to the exercises handler in template order with the other kinds", () => {
    const template = generateWorkoutWithExercises([
      generatePicksBlock("WU", { picks: [{ tags: ["SKILL_WU"], count: 2 }] }),
      generateExercisesBlock(["25", "50"]),
      generateBranchesBlock("GKS", ["510"]),
    ]);
    const visits: string[] = [];
    const handlers = generateHandlerRegistry((block) => {
      visits.push(`${block.kind} ${block.skill}`);
      return block.kind === "exercises"
        ? generatePrescribedBlockResult(block)
        : generateFilledBlockResult(block, []);
    });

    const results = walkTemplateBlocks(
      template,
      generateWorkoutInput(),
      handlers,
    );

    expect(visits).toEqual(["picks WU", "exercises TEST", "branches GKS"]);
    expect(results.map((result) => result.status)).toEqual([
      "filled",
      "prescribed",
      "filled",
    ]);
  });

  it("hands every handler the block path of the template id and the block index", () => {
    const template = generateWorkoutWithExercises(
      [
        generateBranchesBlock("GKS", ["510"]),
        generatePicksBlock("WU", { picks: [{ tags: ["SKILL_WU"], count: 1 }] }),
        { kind: "duration", skill: "MOB", duration: 300 },
        generateExercisesBlock(["25"]),
      ],
      "TESTDAY",
    );
    const paths: (string | undefined)[] = [];
    const handlers = generateHandlerRegistry(
      (block, _input, _usedBranches, walk) => {
        paths.push(walk?.blockPath);
        return block.kind === "exercises"
          ? generatePrescribedBlockResult(block)
          : generateFilledBlockResult(block, []);
      },
    );

    walkTemplateBlocks(template, generateWorkoutInput(), handlers);

    expect(paths).toEqual([
      "TESTDAY.blocks[0]",
      "TESTDAY.blocks[1]",
      "TESTDAY.blocks[2]",
      "TESTDAY.blocks[3]",
    ]);
  });

  it("adds no used branch IDs for a prescribed result and still hands a later workout scope block the earlier branches", () => {
    const template = generateWorkoutWithExercises([
      generateBranchesBlock("GKS", ["510"]),
      generateExercisesBlock(["25", "50"]),
      generatePicksBlock("MOB", { picks: [{ tags: ["SKILL_MOB"], count: 1 }] }),
    ]);
    let receivedByPicks: string[] = [];
    const handlers = generateHandlerRegistry(
      (block) =>
        block.kind === "exercises"
          ? generatePrescribedBlockResult(block)
          : generateFilledBlockResult(
              block,
              block.kind === "branches" ? block.branches : [],
            ),
      {
        picks: {
          usedBranchScope: "workout",
          handleBlock: (block, _input, usedBranches) => {
            receivedByPicks = [...usedBranches];
            return generateFilledBlockResult(block, []);
          },
        },
      },
    );

    const results = walkTemplateBlocks(
      template,
      generateWorkoutInput(),
      handlers,
    );

    expect(results[1].usedBranchIds).toEqual([]);
    expect(receivedByPicks).toEqual(["510"]);
  });
});
