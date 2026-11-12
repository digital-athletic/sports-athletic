import { type Block, type Template } from "@/schemas/aiwl.schema";
import { detectCustomWorkoutFocus } from "./customWorkoutFocus";

// e.g. { kind: "picks", skill: "SWR1", picks: [{ tags: [], count: 2 }] }
const generatePicksBlock = (skill: string): Block => ({
  kind: "picks",
  skill,
  picks: [{ tags: [], count: 2 }],
});

// e.g. { aiwl: 1, id: "MY_WORKOUT", name: { en: "My workout" }, blocks: [{ kind: "picks", skill: "SWR1", picks: [{ tags: [], count: 2 }] }] }
const generateTemplate = (blocks: Block[]): Template => ({
  aiwl: 1,
  id: "MY_WORKOUT",
  name: { en: "My workout" },
  blocks,
});

describe("detectCustomWorkoutFocus: one main block", () => {
  it.each([
    ["SWR1", "strength"],
    ["MAX", "strength"],
    ["SA", "strength"],
    ["SK", "explosive"],
    ["SKKG", "explosive"],
    ["PLYO_MEDIUM", "explosive"],
    ["MOB", "mobility"],
    ["GKS", "stability"],
    ["PREVKNEE", "prevention"],
    ["CARDIO_2", "cardio"],
  ])("reads the skill %s as %s", (skill, focus) => {
    const template = generateTemplate([generatePicksBlock(skill)]);

    expect(detectCustomWorkoutFocus(template)).toBe(focus);
  });

  it("reads a cardio duration block as cardio", () => {
    const template = generateTemplate([
      { kind: "duration", skill: "CARDIO_1_LAKTAT", duration: 1200 },
    ]);

    expect(detectCustomWorkoutFocus(template)).toBe("cardio");
  });

  it("reads a skill missing from the skill catalog as strength", () => {
    const template = generateTemplate([generatePicksBlock("UNKNOWN_SKILL")]);

    expect(detectCustomWorkoutFocus(template)).toBe("strength");
  });
});

describe("detectCustomWorkoutFocus: several blocks", () => {
  it("ignores the warm-up and the cool-down", () => {
    const template = generateTemplate([
      generatePicksBlock("WU"),
      generatePicksBlock("WUSKSA"),
      generatePicksBlock("CARDIO_3"),
      generatePicksBlock("CD"),
    ]);

    expect(detectCustomWorkoutFocus(template)).toBe("cardio");
  });

  it("picks the focus with the most blocks", () => {
    const template = generateTemplate([
      generatePicksBlock("MOB"),
      generatePicksBlock("SWR1"),
      generatePicksBlock("SWR2"),
    ]);

    expect(detectCustomWorkoutFocus(template)).toBe("strength");
  });

  it("picks the earlier focus when two have the same number of blocks", () => {
    const template = generateTemplate([
      generatePicksBlock("MOB"),
      generatePicksBlock("SWR1"),
    ]);

    expect(detectCustomWorkoutFocus(template)).toBe("mobility");
  });

  it("reads a workout of warm-up blocks only as strength", () => {
    const template = generateTemplate([generatePicksBlock("WU")]);

    expect(detectCustomWorkoutFocus(template)).toBe("strength");
  });
});
