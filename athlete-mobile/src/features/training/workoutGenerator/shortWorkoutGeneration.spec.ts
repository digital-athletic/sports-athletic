import { loadExercises } from "@/data/loadExercises";
import { loadTemplates } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { Block } from "@/schemas/aiwl.schema";
import { generateGenerationInput } from "@test/factories/generationInput";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { describeSetListEntries } from "@test/factories/setListDescription";
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

  // Pins the bundled templates, exercises and skill trees: a data change
  // fails these cases without a logic regression.
  it.each<[string, string[]]>([
    [
      "WU",
      [
        "399 1/1",
        "pause 10",
        "407 1/1",
        "pause 10",
        "387 1/1",
        "pause 10",
        "402 1/1",
        "pause 10",
        "392 1/1",
        "pause 10",
        "401 1/1",
        "pause 10",
        "1112 1/1",
        "pause 10",
        "432 1/1",
        "pause 10",
        "135 1/1",
        "pause 10",
        "421 1/1",
      ],
    ],
    [
      "BAS",
      [
        "530 1/2",
        "pause 30",
        "533 1/2",
        "pause 30",
        "530 2/2",
        "pause 30",
        "533 2/2",
        "pause 30",
        "1082 1/2",
        "pause 30",
        "1083 1/2",
        "pause 30",
        "1082 2/2",
        "pause 30",
        "1083 2/2",
      ],
    ],
    [
      "GKS",
      [
        "357 1/2",
        "pause 45",
        "357 2/2",
        "pause 45",
        "242 1/2",
        "pause 45",
        "862 1/2",
        "pause 45",
        "242 2/2",
        "pause 45",
        "862 2/2",
      ],
    ],
    [
      "PREVKNEE",
      [
        "1131 1/1",
        "pause 10",
        "1132 1/1",
        "pause 10",
        "425 1/1",
        "pause 10",
        "389 1/1",
        "pause 30",
        "1149 1/2",
        "pause 30",
        "1150 1/2",
        "pause 30",
        "1149 2/2",
        "pause 30",
        "1150 2/2",
        "pause 60",
        "1001 1/2",
        "pause 30",
        "1192 1/2",
        "pause 30",
        "1001 2/2",
        "pause 30",
        "1192 2/2",
        "pause 60",
        "514 1/2",
        "pause 30",
        "1107 1/2",
        "pause 30",
        "514 2/2",
        "pause 30",
        "1107 2/2",
      ],
    ],
  ])(
    "keeps the exercises, sets and rests of the %s template",
    (templateId, expected) => {
      const setList = generateShortWorkoutFromTemplate(
        loadTemplates()[templateId],
        generateGenerationInput({
          exerciseCatalog: loadExercises(),
          random: generateSeededRandom(7),
        }),
        getAllSkillTrees(),
      );

      expect(describeSetListEntries(setList)).toEqual(expected);
    },
  );

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
