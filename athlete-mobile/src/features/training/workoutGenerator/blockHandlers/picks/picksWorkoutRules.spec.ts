import {
  generateRuleFamilyInput,
  generateSkillTreeBranches,
} from "@test/factories/ruleFamilyInput";
import {
  generateKneeSkillTrees,
  generateTreeBranch,
} from "@test/factories/skillTree";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateShortTemplate,
} from "@test/factories/templateBlock";
import { generateLeveledInput } from "@test/factories/workoutInput";
import {
  createEmptyPicksWorkout,
  filterPoolByPicksWorkoutRules,
  readResolvedPicksBlockTiming,
  resolvePicksWorkout,
} from "./picksWorkoutRules";

const CHILD_BIRTHDAY = "2016-01-01";

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
    const warmUpBlock = generatePicksBlock("WU", {
      picks: [{ tags: [], count: 10 }],
    });
    const input = generateLeveledInput({ gender: "FEMALE" });
    const skillTrees = {
      WU: {
        "1026": generateTreeBranch(["e1"], ["GENDER_MALE"]),
        "2": generateTreeBranch(["e2"]),
      },
    };

    const picksWorkout = resolvePicksWorkout(
      generateShortTemplate([warmUpBlock]),
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
    const stabilityBlock = generatePicksBlock("BAS");
    const template = generateShortTemplate([
      stabilityBlock,
      generatePicksBlock("MOB"),
    ]);
    const input = generateLeveledInput({ pains: ["KNEE_LEFT"] });

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
    const template = generateShortTemplate([generatePicksBlock("BAS")]);
    const input = generateLeveledInput({ pains: ["KNEE_LEFT"] });

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
    const template = generateShortTemplate([
      generatePicksBlock("BAS"),
      generateBranchesBlock("GKS", ["523"]),
    ]);
    const input = generateLeveledInput({ pains: ["KNEE_LEFT"] });

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
    const template = generateShortTemplate([
      generateBranchesBlock("GKS", ["523"]),
    ]);
    const input = generateLeveledInput({ pains: ["KNEE_LEFT"] });

    const picksWorkout = resolvePicksWorkout(template, input);

    expect(picksWorkout.pool).toEqual({});
    expect(picksWorkout.blocks.size).toBe(0);
    expect(picksWorkout.draw.single({}, [])).toBeNull();
  });

  it("returns a fresh empty picks workout on every call", () => {
    const template = generateShortTemplate([
      generateBranchesBlock("GKS", ["523"]),
    ]);
    const input = generateLeveledInput();

    const first = resolvePicksWorkout(template, input);
    const second = resolvePicksWorkout(template, input);

    expect(first.blocks).not.toBe(second.blocks);
    expect(first.pool).not.toBe(second.pool);
  });
});

describe("picksWorkoutRules: readResolvedPicksBlockTiming", () => {
  it("reads only the timing of the block workout setup resolved", () => {
    const block = generatePicksBlock("MOB", { sets: 2 });
    const picksWorkout = resolvePicksWorkout(
      generateShortTemplate([block]),
      generateLeveledInput(),
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
    const block = generatePicksBlock("MOB");

    expect(() =>
      readResolvedPicksBlockTiming(createEmptyPicksWorkout(), block),
    ).toThrow(new Error("Workout setup resolved no picks block for skill MOB"));
  });
});
