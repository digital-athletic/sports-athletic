import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { Block, Template } from "@/schemas/aiwl.schema";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { PICKS_BLOCK_HANDLER } from "./picksHandler";
import { generateShortWorkoutFromTemplate } from "./shortWorkoutGeneration";

const BREATHING_BLOCK: Block = {
  kind: "picks",
  skill: "BR",
  picks: [{ tags: [], count: 1 }],
};

/**
 * Builds a short workout template with a breathing block first.
 *
 * generateShortWorkoutTemplate([{ kind: "picks", skill: "MOB", ... }])
 * → { aiwl: 1, id: "short", blocks: [BR picks, MOB picks] }
 */
const generateShortWorkoutTemplate = (blocks: Block[]): Template => ({
  aiwl: 1,
  id: "short",
  name: { en: "Short" },
  blocks: [BREATHING_BLOCK, ...blocks],
});

/**
 * Replaces the breathing tree by the first two breathing branches with the
 * given tags. Without tags no equipment rule removes them; with BLOCK_KNEE
 * knee pain empties the pool.
 *
 * generateBreathingTrees(["BLOCK_KNEE"]).BR
 * → { "990001": { tags: ["BLOCK_KNEE"], levels }, "990002": { ... } }
 */
const generateBreathingTrees = (tags: string[]) => {
  const skillTrees = getAllSkillTrees();
  const [first, second] = Object.values(skillTrees.BR);
  return {
    ...skillTrees,
    BR: { "990001": { ...first, tags }, "990002": { ...second, tags } },
  };
};

const readThrownValue = (run: () => unknown): unknown => {
  try {
    run();
  } catch (thrown) {
    return thrown;
  }
  throw new Error("Expected a throw");
};

describe("shortWorkoutGeneration: generateShortWorkoutFromTemplate", () => {
  afterEach(jest.restoreAllMocks);

  it("draws the blocks in template order from the given skill trees and drops the last pause", () => {
    const handleBlock = jest.spyOn(PICKS_BLOCK_HANDLER, "handleBlock");
    const template = generateShortWorkoutTemplate([BREATHING_BLOCK]);

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
    ["branches", { kind: "branches", skill: "GKS", branches: ["510"] }],
    ["duration", { kind: "duration", skill: "MOB", duration: 300 }],
    [
      "bodyParts",
      {
        kind: "picks",
        skill: "MOB",
        picks: [{ tags: [], count: 1 }],
        bodyParts: { regions: ["core"] },
      },
    ],
    [
      "order",
      {
        kind: "picks",
        skill: "MOB",
        picks: [{ tags: [], count: 1 }],
        order: "asDrawn",
      },
    ],
  ])(
    "rejects a block with %s before the picks workout rules run",
    (unsupported, block) => {
      const template = generateShortWorkoutTemplate([block]);

      expect(
        readThrownValue(() =>
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
    const template: Template = {
      aiwl: 1,
      id: "own",
      name: { en: "Own" },
      blocks: [{ kind: "branches", skill: "GKS", branches: ["510"] }],
    };

    expect(
      readThrownValue(() =>
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
      readThrownValue(() =>
        generateShortWorkoutFromTemplate(
          generateShortWorkoutTemplate([]),
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
      const template: Template = {
        aiwl: 1,
        id: "empty",
        name: { en: "Empty" },
        blocks: [],
      };

      expect(
        readThrownValue(() =>
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
