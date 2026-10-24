import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { Block } from "@/schemas/aiwl.schema";
import { resolveBlockTiming, type TimingDefaults } from "./blockTiming";
import { readPlanWorkoutTiming } from "./planWorkoutTiming";
import { readSkillCatalogEntry } from "./skillCatalogEntry";

/**
 * Builds a short workout block of the skill without values of its own.
 *
 * generatePicksBlock("UNKNOWN") → { kind: "picks", skill: "UNKNOWN", picks: [{ tags: [], count: 1 }] }
 */
const generatePicksBlock = (skill: string): Block => ({
  kind: "picks",
  skill,
  picks: [{ tags: [], count: 1 }],
});

describe("blockTiming: resolveBlockTiming", () => {
  it("takes the block's own values before the plan workout values", () => {
    const block: Block = {
      kind: "branches",
      skill: "GKS",
      branches: ["1"],
      sets: 3,
      superset: "drawOrder",
      setDuration: 20,
      values: "exercise",
      rest: { betweenSets: 15, afterBlock: 40 },
    };

    expect(resolveBlockTiming(block, readPlanWorkoutTiming("GKS"))).toEqual({
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

  it("reads the skill catalog values of a short workout block without its afterBlock", () => {
    const timing = resolveBlockTiming(
      generatePicksBlock("WUSPEZIAL"),
      readSkillCatalogEntry(loadSkillCatalog(), "WUSPEZIAL"),
    );

    expect(timing).toEqual({
      sets: 1,
      superset: "muscles",
      rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
    });
    expect(timing.rest.afterBlock).toBeUndefined();
  });

  it.each<{ defaults: TimingDefaults | undefined; message: string }>([
    { defaults: undefined, message: "sets: skill UNKNOWN sets no default" },
    {
      defaults: {
        sets: 2,
        rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
      },
      message: "superset: skill UNKNOWN sets no default",
    },
    {
      defaults: { sets: 2, superset: "none" },
      message: "rest.withinSuperset: skill UNKNOWN sets no default",
    },
  ])("throws $message", ({ defaults, message }) => {
    expect(() =>
      resolveBlockTiming(generatePicksBlock("UNKNOWN"), defaults),
    ).toThrow(message);
  });

  it("throws for a skill whose catalog entry sets no timing", () => {
    expect(() =>
      resolveBlockTiming(
        generatePicksBlock("CARDIO_2"),
        readSkillCatalogEntry(loadSkillCatalog(), "CARDIO_2"),
      ),
    ).toThrow("sets: skill CARDIO_2 sets no default");
  });
});
