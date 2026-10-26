import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { generateHandlerRegistry } from "@test/factories/blockHandlers";
import {
  generateBlockResult,
  generateEmptyBlockResult,
} from "@test/factories/blockResult";
import { generateEquipmentError } from "@test/factories/generatorError";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateShortTemplate,
  generateTemplate,
} from "@test/factories/templateBlock";
import {
  type BuiltBlockResult,
  TRAINING_DAY_FINISH_RULES,
} from "./stages/workoutFinish";
import type { WorkoutInput } from "./stages/workoutSetup";
import { interpretTemplate } from "./templateInterpreter";

/**
 * A stored training day in stored skill order, which differs from the
 * section order BR, GKS, SWR2KG, CD.
 *
 * { blocks: [SWR2KG ["79"], CD ["2"], GKS ["510"], BR ["1"]] }
 */
const STORED_TRAINING_DAY = generateTemplate([
  generateBranchesBlock("SWR2KG", ["79"]),
  generateBranchesBlock("CD", ["2"]),
  generateBranchesBlock("GKS", ["510"]),
  generateBranchesBlock("BR", ["1"]),
]);

/**
 * Stub set list builder: one entry per filled block, named by its skill.
 *
 * buildSkillSetList([BR block, GKS block]) → ["BR", "GKS"]
 */
const buildSkillSetList = (blocks: BuiltBlockResult[]): string[] =>
  blocks.map((result) => result.block.skill);

describe("templateInterpreter: interpretTemplate", () => {
  it("sets the workout up once, walks the stored order and builds in section order", () => {
    const receivedInputs: WorkoutInput[] = [];
    const visits: string[] = [];
    const handlers = generateHandlerRegistry(undefined, {
      branches: {
        usedBranchScope: "block",
        handleBlock: (block, input) => {
          receivedInputs.push(input);
          visits.push(block.skill);
          return generateBlockResult("filled", {
            block,
            usedBranchIds: block.branches,
            exercises: [],
          });
        },
      },
    });

    const workout = interpretTemplate(
      STORED_TRAINING_DAY,
      generateRuleFamilyInput({ pains: ["KNEE_LEFT"] }),
      {
        handlers,
        finishRules: TRAINING_DAY_FINISH_RULES,
        createSetListBuilder: (input) => {
          receivedInputs.push(input);
          return buildSkillSetList;
        },
      },
    );

    expect(visits).toEqual(["SWR2KG", "CD", "GKS", "BR"]);
    expect(receivedInputs[0].blockedRegions).toEqual(["KNEE"]);
    // the four handlers and the set list builder share one workout input
    expect(receivedInputs).toHaveLength(5);
    expect(new Set(receivedInputs).size).toBe(1);
    expect(workout.setList).toEqual(["BR", "GKS", "SWR2KG", "CD"]);
  });

  it("hands each picks block the workout input that resolved it in workout setup", () => {
    const template = generateShortTemplate([
      generatePicksBlock("WU", { picks: [{ tags: [], count: 2 }] }),
    ]);
    const resolvedSkills: (string | undefined)[] = [];
    const handlers = generateHandlerRegistry(undefined, {
      picks: {
        usedBranchScope: "workout",
        handleBlock: (block, input) => {
          resolvedSkills.push(input.picksWorkout.blocks.get(block)?.skill);
          return generateEmptyBlockResult(block);
        },
      },
    });

    interpretTemplate(template, generateRuleFamilyInput(), {
      handlers,
      finishRules: TRAINING_DAY_FINISH_RULES,
      createSetListBuilder: () => buildSkillSetList,
    });

    expect(resolvedSkills).toEqual(["WU"]);
  });

  it("resolves the picks blocks from the given skill trees", () => {
    const template = generateShortTemplate([generatePicksBlock("WU")]);
    const skillTrees = getAllSkillTrees();
    const warmUpBranch = skillTrees.WU["409"];
    const poolKeys: string[][] = [];
    const handlers = generateHandlerRegistry(undefined, {
      picks: {
        usedBranchScope: "workout",
        handleBlock: (block, input) => {
          poolKeys.push(Object.keys(input.picksWorkout.pool));
          return generateEmptyBlockResult(block);
        },
      },
    });

    interpretTemplate(template, generateRuleFamilyInput(), {
      handlers,
      finishRules: TRAINING_DAY_FINISH_RULES,
      createSetListBuilder: () => buildSkillSetList,
      skillTrees: { ...skillTrees, WU: { "409": warmUpBranch } },
    });

    expect(poolKeys).toEqual([["409"]]);
  });

  it("names the first empty skill in stored order on a day where every skill empties", () => {
    const handlers = generateHandlerRegistry(undefined, {
      branches: {
        usedBranchScope: "block",
        handleBlock: (block) =>
          generateEmptyBlockResult(
            block,
            generateEquipmentError([`missing for ${block.skill}`]),
          ),
      },
    });

    expect(() =>
      interpretTemplate(STORED_TRAINING_DAY, generateRuleFamilyInput(), {
        handlers,
        finishRules: TRAINING_DAY_FINISH_RULES,
        createSetListBuilder: () => buildSkillSetList,
      }),
    ).toThrow(
      expect.objectContaining({
        type: "NO_EXERCISES",
        subtype: "EQUIPMENT",
        params: ["missing for SWR2KG"],
      }),
    );
  });
});
