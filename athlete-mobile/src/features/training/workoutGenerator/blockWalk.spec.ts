import type { Block } from "@/schemas/aiwl.schema";
import { generateFilledBlockResult } from "../../../../test/factories/blockResult";
import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import { generateTemplate } from "../../../../test/factories/templateBlock";
import { type BlockHandlerRegistry, walkTemplateBlocks } from "./blockWalk";
import { setUpWorkout } from "./workoutSetup";

describe("blockWalk: walkTemplateBlocks", () => {
  it("hands each block to the handler of its kind in template order and draws in that order", () => {
    const template = generateTemplate([
      { kind: "branches", skill: "SWR2KG", branches: ["79"] },
      { kind: "picks", skill: "WU", picks: [{ tags: ["SKILL_WU"], count: 2 }] },
      { kind: "branches", skill: "GKS", branches: ["510"] },
      { kind: "duration", skill: "MOB", duration: 300 },
    ]);
    const draws = [0.2, 0.4, 0.6, 0.8];
    const input = setUpWorkout({
      ...generateRuleFamilyInput(),
      random: () => draws.shift() ?? 0,
    });
    const visits: string[] = [];
    const handleBlock = (block: Block, blockInput: typeof input) => {
      visits.push(`${block.kind} ${block.skill} ${blockInput.random()}`);
      return generateFilledBlockResult(block, []);
    };
    const handlers: BlockHandlerRegistry = {
      picks: { usedBranchScope: "workout", handleBlock },
      branches: { usedBranchScope: "block", handleBlock },
      duration: { usedBranchScope: "workout", handleBlock },
    };

    const results = walkTemplateBlocks(template, input, handlers);

    expect(visits).toEqual([
      "branches SWR2KG 0.2",
      "picks WU 0.4",
      "branches GKS 0.6",
      "duration MOB 0.8",
    ]);
    expect(results.map((result) => result.block)).toEqual(template.blocks);
  });

  it("threads used branches of filled and empty picks blocks across the workout and starts each branches block empty", () => {
    const template = generateTemplate([
      { kind: "picks", skill: "WU", picks: [{ tags: ["SKILL_WU"], count: 2 }] },
      { kind: "branches", skill: "GKS", branches: ["510", "523"] },
      { kind: "picks", skill: "BR", picks: [{ tags: ["SKILL_BR"], count: 1 }] },
      { kind: "branches", skill: "SWR2KG", branches: ["79"] },
      {
        kind: "picks",
        skill: "MOB",
        picks: [{ tags: ["SKILL_MOB"], count: 1 }],
      },
      { kind: "picks", skill: "CD", picks: [{ tags: ["SKILL_CD"], count: 1 }] },
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
            ? {
                status: "empty",
                block,
                reason: undefined,
                usedBranchIds: drawn,
              }
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
    };

    walkTemplateBlocks(
      template,
      setUpWorkout(generateRuleFamilyInput()),
      handlers,
    );

    expect(receivedBySkill).toEqual({
      WU: [],
      GKS: [],
      BR: ["11", "12"],
      SWR2KG: [],
      MOB: ["11", "12", "14"],
      CD: ["11", "12", "14", "13"],
    });
  });
});
