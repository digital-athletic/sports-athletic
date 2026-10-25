import type { Block, PicksBlock, Template } from "@/schemas/aiwl.schema";
import {
  generateRuleFamilyInput,
  generateSkillTreeBranches,
} from "../../../../test/factories/ruleFamilyInput";
import {
  createEmptyPicksWorkout,
  filterPoolByPicksWorkoutRules,
  readResolvedPicksBlockTiming,
  resolvePicksWorkout,
} from "./picksWorkoutRules";

const CHILD_BIRTHDAY = "2016-01-01";

/**
 * Wraps blocks into an AIWL template.
 *
 * generateTemplate([{ kind: "picks", skill: "WU", picks: [{ tags: [], count: 2 }] }])
 * → { aiwl: 1, id: "short", name: { en: "Short" }, blocks: [{ kind: "picks", ... }] }
 */
const generateTemplate = (blocks: Block[]): Template => ({
  aiwl: 1,
  id: "short",
  name: { en: "Short" },
  blocks,
});

/**
 * Builds skill trees with a BAS branch blocked on knee pain and a MOB branch
 * without tags.
 *
 * generateKneeSkillTrees()
 * → { BAS: { "1": { tags: ["BLOCK_KNEE"], ... } }, MOB: { "2": { tags: [], ... } } }
 */
const generateKneeSkillTrees = () => ({
  BAS: { "1": { tags: ["BLOCK_KNEE"], levels: { 1: { exerciseId: "e1" } } } },
  MOB: { "2": { tags: [], levels: { 1: { exerciseId: "e2" } } } },
});

describe("picksWorkoutRules: filterPoolByPicksWorkoutRules", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the branches that pass pain, equipment, age and gender", () => {
    const input = generateRuleFamilyInput({ equipment: ["DUMBBELL"] });
    const pool = {
      ...generateSkillTreeBranches("GKS", ["510"]),
      ...generateSkillTreeBranches("GKSKG", ["547"]),
    };

    expect(Object.keys(filterPoolByPicksWorkoutRules(pool, input))).toEqual([
      "510",
      "547",
    ]);
  });

  it("throws the pain error when pain and missing equipment both empty the pool", () => {
    const input = generateRuleFamilyInput({ pains: ["KNEE_LEFT"] });
    const pool = generateSkillTreeBranches("GKS", ["523"]);

    expect(() => filterPoolByPicksWorkoutRules(pool, input)).toThrow(
      expect.objectContaining({
        type: "NO_EXERCISES",
        subtype: "PAIN",
        params: ["KNEE"],
      }),
    );
  });

  it("throws the equipment error when equipment and age both empty the pool", () => {
    const input = generateRuleFamilyInput({ birthday: CHILD_BIRTHDAY });
    const pool = generateSkillTreeBranches("GKS", ["510"]);

    expect(() => filterPoolByPicksWorkoutRules(pool, input)).toThrow(
      expect.objectContaining({
        type: "NO_EXERCISES",
        subtype: "EQUIPMENT",
        params: ["DUMBBELL"],
      }),
    );
  });

  it("throws the age error when age and gender both empty the pool", () => {
    const input = generateRuleFamilyInput({
      birthday: CHILD_BIRTHDAY,
      gender: "FEMALE",
    });
    const pool = generateSkillTreeBranches("WU", ["1026"]);

    expect(() => filterPoolByPicksWorkoutRules(pool, input)).toThrow(
      expect.objectContaining({
        type: "NO_EXERCISES",
        subtype: "AGE",
        params: [],
      }),
    );
  });

  it("throws the gender error when only gender empties the pool", () => {
    const input = generateRuleFamilyInput({ gender: "FEMALE" });
    const pool = generateSkillTreeBranches("WU", ["1026"]);

    expect(() => filterPoolByPicksWorkoutRules(pool, input)).toThrow(
      expect.objectContaining({
        type: "NO_EXERCISES",
        subtype: "GENDER",
        params: [],
      }),
    );
  });
});

describe("picksWorkoutRules: resolvePicksWorkout", () => {
  it("resolves each picks block and filters the union pool", () => {
    const warmUpBlock: PicksBlock = {
      kind: "picks",
      skill: "WU",
      picks: [{ tags: [], count: 10 }],
    };
    const input = {
      ...generateRuleFamilyInput({ gender: "FEMALE" }),
      athleteLevel: "ADVANCED",
    };
    const skillTrees = {
      WU: {
        "1026": {
          tags: ["GENDER_MALE"],
          levels: { 1: { exerciseId: "e1" } },
        },
        "2": { tags: [], levels: { 1: { exerciseId: "e2" } } },
      },
    };

    const picksWorkout = resolvePicksWorkout(
      generateTemplate([warmUpBlock]),
      input,
      skillTrees,
    );

    expect(picksWorkout.blocks.size).toBe(1);
    expect(picksWorkout.blocks.get(warmUpBlock)).toMatchObject({
      skill: "WU",
      sets: 1,
      countBy: "entries",
      fallbackToWholeTree: false,
      picks: [{ tags: [], count: 10 }],
    });
    expect(
      Object.keys(picksWorkout.blocks.get(warmUpBlock)?.pool ?? {}),
    ).toEqual(["2", "1026"]);
    expect(Object.keys(picksWorkout.pool)).toEqual(["2"]);
  });

  it("keeps the union pool when the rules empty the pool of one block only", () => {
    const stabilityBlock: PicksBlock = {
      kind: "picks",
      skill: "BAS",
      picks: [{ tags: [], count: 1 }],
    };
    const template = generateTemplate([
      stabilityBlock,
      { kind: "picks", skill: "MOB", picks: [{ tags: [], count: 1 }] },
    ]);
    const input = {
      ...generateRuleFamilyInput({ pains: ["KNEE_LEFT"] }),
      athleteLevel: "ADVANCED",
    };

    const picksWorkout = resolvePicksWorkout(
      template,
      input,
      generateKneeSkillTrees(),
    );

    expect(Object.keys(picksWorkout.pool)).toEqual(["2"]);
    expect(
      Object.keys(picksWorkout.blocks.get(stabilityBlock)?.pool ?? {}),
    ).toEqual(["1"]);
  });

  it("throws the rule error when the rules empty the union pool", () => {
    const template = generateTemplate([
      { kind: "picks", skill: "BAS", picks: [{ tags: [], count: 1 }] },
    ]);
    const input = {
      ...generateRuleFamilyInput({ pains: ["KNEE_LEFT"] }),
      athleteLevel: "ADVANCED",
    };

    expect(() =>
      resolvePicksWorkout(template, input, generateKneeSkillTrees()),
    ).toThrow(
      expect.objectContaining({
        type: "NO_EXERCISES",
        subtype: "PAIN",
        params: ["KNEE"],
      }),
    );
  });

  it("rejects a branches block beside picks blocks at its template index before any rule", () => {
    const template = generateTemplate([
      { kind: "picks", skill: "BAS", picks: [{ tags: [], count: 1 }] },
      { kind: "branches", skill: "GKS", branches: ["523"] },
    ]);
    const input = {
      ...generateRuleFamilyInput({ pains: ["KNEE_LEFT"] }),
      athleteLevel: "ADVANCED",
    };

    expect(() =>
      resolvePicksWorkout(template, input, generateKneeSkillTrees()),
    ).toThrow(
      expect.objectContaining({
        type: "OTHER",
        subtype: "BLOCK_KIND",
        params: ["short.blocks[1]", "branches"],
      }),
    );
  });

  it("runs no rule for a template without picks blocks", () => {
    const template = generateTemplate([
      { kind: "branches", skill: "GKS", branches: ["523"] },
    ]);
    const input = {
      ...generateRuleFamilyInput({ pains: ["KNEE_LEFT"] }),
      athleteLevel: "ADVANCED",
    };

    const picksWorkout = resolvePicksWorkout(template, input);

    expect(picksWorkout.pool).toEqual({});
    expect(picksWorkout.blocks.size).toBe(0);
    expect(picksWorkout.draw.single({}, [])).toBeNull();
  });

  it("returns a fresh empty picks workout on every call", () => {
    const template = generateTemplate([
      { kind: "branches", skill: "GKS", branches: ["523"] },
    ]);
    const input = { ...generateRuleFamilyInput(), athleteLevel: "ADVANCED" };

    const first = resolvePicksWorkout(template, input);
    const second = resolvePicksWorkout(template, input);

    expect(first.blocks).not.toBe(second.blocks);
    expect(first.pool).not.toBe(second.pool);
  });
});

describe("picksWorkoutRules: readResolvedPicksBlockTiming", () => {
  it("reads only the timing of the block workout setup resolved", () => {
    const block: PicksBlock = {
      kind: "picks",
      skill: "MOB",
      picks: [{ tags: [], count: 1 }],
      sets: 2,
    };
    const picksWorkout = resolvePicksWorkout(
      generateTemplate([block]),
      { ...generateRuleFamilyInput(), athleteLevel: "ADVANCED" },
      generateKneeSkillTrees(),
    );

    expect(readResolvedPicksBlockTiming(picksWorkout, block)).toEqual({
      sets: 2,
      superset: "muscles",
      rest: {
        withinSuperset: 10,
        betweenSets: 10,
        afterExercise: 10,
        afterBlock: undefined,
      },
      setDuration: undefined,
      values: undefined,
    });
  });

  it("throws for a block that workout setup did not resolve", () => {
    const block: PicksBlock = {
      kind: "picks",
      skill: "MOB",
      picks: [{ tags: [], count: 1 }],
    };

    expect(() =>
      readResolvedPicksBlockTiming(createEmptyPicksWorkout(), block),
    ).toThrow(new Error("Workout setup resolved no picks block for skill MOB"));
  });
});
