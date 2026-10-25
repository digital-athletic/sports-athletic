import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { Block } from "@/schemas/aiwl.schema";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateBreathingTrees } from "@test/factories/skillTree";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateShortTemplateWithBreathing,
  generateTemplate,
} from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import { PICKS_BLOCK_HANDLER } from "./blockHandlers/picks/picksHandler";
import { generateShortWorkoutFromTemplate } from "./shortWorkoutGeneration";

describe("shortWorkoutGeneration: generateShortWorkoutFromTemplate", () => {
  afterEach(jest.restoreAllMocks);

  it("draws the blocks in template order from the given skill trees and drops the last pause", () => {
    const handleBlock = jest.spyOn(PICKS_BLOCK_HANDLER, "handleBlock");
    const template = generateShortTemplateWithBreathing([
      generatePicksBlock("BR"),
    ]);

    const setList = generateShortWorkoutFromTemplate(
      template,
      generateRuleFamilyInput({ exerciseCatalog: loadExercises() }),
      generateBreathingTrees([]),
    );

    expect(handleBlock).toHaveBeenCalledTimes(2);
    expect([...new Set(setList.map((entry) => entry.branchId))]).toEqual(
      expect.arrayContaining(["990001", "990002"]),
    );
    expect(isPauseExercise(setList[setList.length - 1].exerciseId)).toBe(false);
  });

  it.each<[string, Block]>([
    ["branches", generateBranchesBlock("GKS", ["510"])],
    ["duration", { kind: "duration", skill: "MOB", duration: 300 }],
    [
      "bodyParts",
      generatePicksBlock("MOB", { bodyParts: { regions: ["core"] } }),
    ],
    ["order", generatePicksBlock("MOB", { order: "asDrawn" })],
  ])(
    "rejects a block with %s before the picks workout rules run",
    (unsupported, block) => {
      const template = generateShortTemplateWithBreathing([block]);

      expect(
        catchThrownValue(() =>
          generateShortWorkoutFromTemplate(
            template,
            generateRuleFamilyInput({ pains: ["KNEE_LEFT"] }),
            generateBreathingTrees(["BLOCK_KNEE"]),
          ),
        ),
      ).toStrictEqual({
        type: "OTHER",
        subtype: "BLOCK_KIND",
        params: ["short.blocks[1]", unsupported],
      });
    },
  );

  it("rejects a template without a picks block", () => {
    const template = generateTemplate([generateBranchesBlock("GKS", ["510"])], {
      id: "own",
      name: { en: "Own" },
    });

    expect(
      catchThrownValue(() =>
        generateShortWorkoutFromTemplate(
          template,
          generateRuleFamilyInput(),
          getAllSkillTrees(),
        ),
      ),
    ).toStrictEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params: ["own.blocks[0]", "branches"],
    });
  });

  it("throws the pain rule error with one region per blocked branch of the given skill trees", () => {
    expect(
      catchThrownValue(() =>
        generateShortWorkoutFromTemplate(
          generateShortTemplateWithBreathing([]),
          generateRuleFamilyInput({ pains: ["KNEE_LEFT"] }),
          generateBreathingTrees(["BLOCK_KNEE"]),
        ),
      ),
    ).toStrictEqual({
      type: "NO_EXERCISES",
      subtype: "PAIN",
      params: ["KNEE", "KNEE"],
    });
  });

  it.each<[string, string[]]>([
    ["without pains", []],
    ["with a knee pain", ["KNEE_LEFT"]],
  ])(
    "throws the pain error with no regions for a template without blocks, %s",
    (_name, pains) => {
      const template = generateTemplate([], {
        id: "empty",
        name: { en: "Empty" },
      });

      expect(
        catchThrownValue(() =>
          generateShortWorkoutFromTemplate(
            template,
            generateRuleFamilyInput({ pains }),
            getAllSkillTrees(),
          ),
        ),
      ).toStrictEqual({ type: "NO_EXERCISES", subtype: "PAIN", params: [] });
    },
  );
});
