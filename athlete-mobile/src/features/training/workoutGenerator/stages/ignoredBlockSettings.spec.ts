import type { BranchSelectingBlock } from "@/schemas/aiwl.schema";
import { Logger } from "@/services/Logger";
import {
  generateBranchesBlock,
  generatePicksBlock,
} from "@test/factories/templateBlock";
import {
  listIgnoredBlockSettings,
  warnIgnoredBlockSettings,
} from "./ignoredBlockSettings";

const REST = {
  withinSuperset: 10,
  betweenSets: 10,
  afterExercise: 10,
  afterBlock: 30,
};

describe("ignoredBlockSettings: listIgnoredBlockSettings", () => {
  it("lists nothing for a block that sets nothing", () => {
    expect(
      listIgnoredBlockSettings(generatePicksBlock("BAS"), "standard"),
    ).toEqual([]);
  });

  it.each<{ kind: "standard" | "maxStrength" | "cardio"; skill: string }>([
    { kind: "standard", skill: "BAS" },
    { kind: "maxStrength", skill: "MAX" },
    { kind: "cardio", skill: "CARDIO_2" },
  ])("lists order of a $kind block", ({ kind, skill }) => {
    expect(
      listIgnoredBlockSettings(
        generatePicksBlock(skill, { order: "asDrawn" }),
        kind,
      ),
    ).toEqual(["order"]);
  });

  it("lists nothing for the settings a standard picks block reads", () => {
    const block = generatePicksBlock("BAS", {
      countBy: "entries",
      fallbackToWholeTree: true,
      sets: 3,
      superset: "muscles",
      setDuration: 40,
      values: "skill",
      rest: REST,
    });

    expect(listIgnoredBlockSettings(block, "standard")).toEqual([]);
  });

  it.each<{ behaviour: string; block: BranchSelectingBlock }>([
    {
      behaviour: "countBy of a branches block",
      block: generateBranchesBlock("BAS", ["1"], { countBy: "pairs" }),
    },
    {
      behaviour: "fallbackToWholeTree of a branches block",
      block: generateBranchesBlock("BAS", ["1"], {
        fallbackToWholeTree: false,
      }),
    },
  ])("lists $behaviour for a standard block", ({ block }) => {
    expect(listIgnoredBlockSettings(block, "standard")).toHaveLength(1);
  });

  it("lists countBy and fallbackToWholeTree of a branches block in a fixed order", () => {
    const block = generateBranchesBlock("BAS", ["1"], {
      fallbackToWholeTree: true,
      countBy: "exercises",
      order: "muscleGroups",
    });

    expect(listIgnoredBlockSettings(block, "standard")).toEqual([
      "order",
      "countBy",
      "fallbackToWholeTree",
    ]);
  });

  it("lists every setting a max strength picks block does not read, in a fixed order", () => {
    const block = generatePicksBlock("MAX", {
      rest: REST,
      values: "exercise",
      setDuration: 30,
      sets: 4,
      superset: "muscles",
      order: "asDrawn",
    });

    expect(listIgnoredBlockSettings(block, "maxStrength")).toEqual([
      "order",
      "superset",
      "sets",
      "setDuration",
      "values",
      "rest",
    ]);
  });

  it.each(["muscles", "drawOrder", "drawOrderWithLeftovers"] as const)(
    "lists the superset %s of a max strength block",
    (superset) => {
      expect(
        listIgnoredBlockSettings(
          generatePicksBlock("MAX", { superset }),
          "maxStrength",
        ),
      ).toEqual(["superset"]);
    },
  );

  it("lists nothing for a max strength block with superset none", () => {
    expect(
      listIgnoredBlockSettings(
        generatePicksBlock("MAX", { superset: "none" }),
        "maxStrength",
      ),
    ).toEqual([]);
  });

  it("lists superset, sets and rest of an interval cardio zone, which reads setDuration and values", () => {
    const block = generatePicksBlock("CARDIO_2", {
      rest: REST,
      values: "skill",
      setDuration: 60,
      sets: 8,
      superset: "none",
    });

    expect(listIgnoredBlockSettings(block, "cardio")).toEqual([
      "superset",
      "sets",
      "rest",
    ]);
  });

  it.each(["CARDIO_4", "CARDIO_5"])(
    "lists setDuration and values of the steady zone %s",
    (skill) => {
      const block = generatePicksBlock(skill, {
        rest: REST,
        values: "skill",
        setDuration: 60,
        sets: 1,
        superset: "none",
      });

      expect(listIgnoredBlockSettings(block, "cardio")).toEqual([
        "superset",
        "sets",
        "setDuration",
        "values",
        "rest",
      ]);
    },
  );

  it("lists countBy of a cardio duration block", () => {
    const block: BranchSelectingBlock = {
      kind: "duration",
      skill: "CARDIO_2",
      duration: 1200,
      countBy: "entries",
    };

    expect(listIgnoredBlockSettings(block, "cardio")).toEqual(["countBy"]);
  });

  it("never lists duration, because a training day stores one on every branches block", () => {
    const block = generateBranchesBlock("MAX", ["1"], { duration: 900 });

    expect(listIgnoredBlockSettings(block, "maxStrength")).toEqual([]);
  });

  it("never lists bodyParts, kind, skill, picks or branches", () => {
    const block = generatePicksBlock("MAX", {
      bodyParts: { regions: ["core"] },
    });

    expect(listIgnoredBlockSettings(block, "maxStrength")).toEqual([]);
  });

  it("does not list a setting the block leaves undefined", () => {
    const block = generatePicksBlock("MAX", {
      order: undefined,
      sets: undefined,
      rest: undefined,
    });

    expect(listIgnoredBlockSettings(block, "maxStrength")).toEqual([]);
  });
});

describe("ignoredBlockSettings: warnIgnoredBlockSettings", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs one warning naming the skill and the ignored settings", () => {
    const logWarning = jest.spyOn(Logger, "logWarning").mockImplementation();

    warnIgnoredBlockSettings("MAX", ["order", "sets", "rest"]);

    expect(logWarning).toHaveBeenCalledTimes(1);
    expect(logWarning).toHaveBeenCalledWith(
      "MAX: the generator ignores order, sets, rest",
    );
  });

  it("logs a single setting without a separator", () => {
    const logWarning = jest.spyOn(Logger, "logWarning").mockImplementation();

    warnIgnoredBlockSettings("CARDIO_2", ["superset"]);

    expect(logWarning).toHaveBeenCalledWith(
      "CARDIO_2: the generator ignores superset",
    );
  });

  it("logs nothing for an empty list", () => {
    const logWarning = jest.spyOn(Logger, "logWarning").mockImplementation();

    warnIgnoredBlockSettings("BAS", []);

    expect(logWarning).not.toHaveBeenCalled();
  });
});
