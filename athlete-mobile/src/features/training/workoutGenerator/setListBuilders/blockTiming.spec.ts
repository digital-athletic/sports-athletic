import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import {
  generateBranchesBlock,
  generatePicksBlock,
} from "@test/factories/templateBlock";
import { resolveBlockTiming, type SkillTimingDefaults } from "./blockTiming";
import { readTrainingDayTimingDefaults } from "./trainingDayTiming";
import { readSkillCatalogEntry } from "../generationInput/skillCatalogEntry";

describe("blockTiming: resolveBlockTiming", () => {
  it("takes the block's own values before the training day defaults", () => {
    const block = generateBranchesBlock("GKS", ["1"], {
      sets: 3,
      superset: "drawOrder",
      setDuration: 20,
      values: "exercise",
      rest: { betweenSets: 15, afterBlock: 40 },
    });

    expect(
      resolveBlockTiming(
        block,
        readTrainingDayTimingDefaults("GKS", loadSkillCatalog()),
      ),
    ).toEqual({
      sets: 3,
      superset: "drawOrder",
      rest: {
        withinSuperset: 45,
        betweenSets: 15,
        afterExercise: 60,
        afterBlock: 40,
      },
      setDuration: 20,
      values: "exercise",
    });
  });

  it("reads the skill catalog values of a short workout block, afterBlock included", () => {
    const timing = resolveBlockTiming(
      generatePicksBlock("WUSPEZIAL"),
      readSkillCatalogEntry(loadSkillCatalog(), "WUSPEZIAL"),
    );

    expect(timing).toEqual({
      sets: 1,
      superset: "muscles",
      rest: {
        withinSuperset: 10,
        betweenSets: 10,
        afterExercise: 10,
        afterBlock: 30,
      },
    });
  });

  it("takes the afterBlock of the block before the one of the skill catalog", () => {
    const timing = resolveBlockTiming(
      generatePicksBlock("SWR2", { rest: { afterBlock: 0 } }),
      {
        sets: 2,
        superset: "muscles",
        rest: {
          withinSuperset: 1,
          betweenSets: 2,
          afterExercise: 3,
          afterBlock: 45,
        },
      },
    );

    expect(timing.rest.afterBlock).toBe(0);
  });

  it("leaves afterBlock undefined where neither the block nor the skill catalog sets one", () => {
    const timing = resolveBlockTiming(generatePicksBlock("SWR2"), {
      sets: 2,
      superset: "muscles",
      rest: { withinSuperset: 1, betweenSets: 2, afterExercise: 3 },
    });

    expect(timing.rest.afterBlock).toBeUndefined();
  });

  it.each([
    ["a picks block", generatePicksBlock("CARDIO_4")],
    ["a branches block", generateBranchesBlock("CARDIO_4", ["580"])],
  ])(
    "resolves superset none for a cardio block that sets none anywhere, as %s",
    (_label, block) => {
      const timing = resolveBlockTiming(block, {
        sets: 1,
        rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
      });

      expect(timing.superset).toBe("none");
    },
  );

  it("resolves superset none for a cardio block without skill catalog defaults of its own", () => {
    const timing = resolveBlockTiming(
      generatePicksBlock("CARDIO_2", {
        sets: 1,
        rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
      }),
      undefined,
    );

    expect(timing.superset).toBe("none");
  });

  it("keeps the superset of a cardio block before the skill catalog's and none", () => {
    const defaults: SkillTimingDefaults = {
      sets: 1,
      superset: "drawOrder",
      rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
    };

    expect(
      resolveBlockTiming(
        generatePicksBlock("CARDIO_2", { superset: "muscles" }),
        defaults,
      ).superset,
    ).toBe("muscles");
    expect(
      resolveBlockTiming(generatePicksBlock("CARDIO_2"), defaults).superset,
    ).toBe("drawOrder");
  });

  it.each(["GKS", "MAX"])(
    "still throws for a %s block that sets no superset anywhere",
    (skill) => {
      expect(() =>
        resolveBlockTiming(generatePicksBlock(skill), {
          sets: 2,
          rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
        }),
      ).toThrow(new Error(`superset: skill ${skill} sets no default`));
    },
  );

  it.each<{
    defaults: SkillTimingDefaults | undefined;
    path?: string;
    message: string;
  }>([
    {
      defaults: undefined,
      message: "rest.withinSuperset: skill UNKNOWN sets no default",
    },
    {
      defaults: undefined,
      path: "SYN.blocks[2]",
      message:
        "SYN.blocks[2].rest.withinSuperset: skill UNKNOWN sets no default",
    },
    {
      defaults: {
        superset: "none",
        rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
      },
      message: "sets: skill UNKNOWN sets no default",
    },
    {
      defaults: {
        sets: 2,
        rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
      },
      message: "superset: skill UNKNOWN sets no default",
    },
  ])("throws $message", ({ defaults, path, message }) => {
    expect(() =>
      resolveBlockTiming(generatePicksBlock("UNKNOWN"), defaults, path),
    ).toThrow(new Error(message));
  });
});
