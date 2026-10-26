import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { generateTreeBranch } from "@test/factories/skillTree";
import {
  generateStrengthTestWarmUpBlock,
  generateWarmUpBranch,
} from "@test/factories/strengthTestWarmUp";
import { generateTaggedExercise } from "@test/factories/valueExercise";
import { generateWorkoutInput } from "@test/factories/workoutInput";
import { createStrengthTestWarmUpHandler } from "./strengthTestWarmUpHandler";

// Catalog of one two sided exercise per ID.
const generateCatalog = (ids: string[]) =>
  ids.map((id) => generateTaggedExercise(id, ["SIDE_BOTH"]));

describe("strengthTestWarmUpHandler: handleBlock", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("never repeats a resolved exercise", () => {
    const block = generateStrengthTestWarmUpBlock();
    const tree = {
      "1": generateWarmUpBranch("a", ["REGION_LOWER_BODY"]),
      "2": generateWarmUpBranch("b", ["REGION_FULL_BODY"]),
      "3": generateWarmUpBranch("c", ["REGION_UPPER_BODY"]),
      "4": generateWarmUpBranch("c", ["REGION_UPPER_BODY"]),
      "5": generateWarmUpBranch("d", ["REGION_CORE"]),
    };
    const input = generateWorkoutInput({
      level: "BEGINNER",
      exerciseCatalog: generateCatalog(["a", "b", "c", "d"]),
      random: () => 0,
    });

    const result = createStrengthTestWarmUpHandler({ WU: tree }).handleBlock(
      block,
      input,
      new Set(),
    );

    expect(result).toMatchObject({
      status: "filled",
      exercises: [
        { branchId: "1", exerciseId: "a" },
        { branchId: "2", exerciseId: "b" },
        { branchId: "3", exerciseId: "c" },
        { branchId: "5", exerciseId: "d" },
      ],
    });
  });

  it("skips branches authored for another age group or gender", () => {
    const block = generateStrengthTestWarmUpBlock();
    const tree = {
      "1": generateWarmUpBranch("a", ["REGION_LOWER_BODY", "AGE_CHILD"]),
      "2": generateWarmUpBranch("b", ["REGION_LOWER_BODY", "GENDER_FEMALE"]),
      "3": generateWarmUpBranch("c", ["REGION_LOWER_BODY"]),
    };
    const input = generateWorkoutInput({
      level: "BEGINNER",
      exerciseCatalog: generateCatalog(["a", "b", "c"]),
      random: () => 0,
    });

    const result = createStrengthTestWarmUpHandler({ WU: tree }).handleBlock(
      block,
      input,
      new Set(),
    );

    expect(result).toMatchObject({
      status: "filled",
      exercises: [{ branchId: "3", exerciseId: "c" }],
      usedBranchIds: ["3"],
    });
  });

  it("draws one branch per pick count in pick order, each from the region of its pick", () => {
    const block = generateStrengthTestWarmUpBlock();
    const tree = {
      "1": generateWarmUpBranch("a", ["REGION_UPPER_BODY"]),
      "2": generateWarmUpBranch("b", ["REGION_FULL_BODY"]),
      "3": generateWarmUpBranch("c", ["REGION_LOWER_BODY"]),
      "4": generateWarmUpBranch("d", ["REGION_CORE"]),
    };
    const input = generateWorkoutInput({
      exerciseCatalog: generateCatalog(["a", "b", "c", "d"]),
      random: generateSequenceRandom([0, 0, 0, 0]),
    });

    const result = createStrengthTestWarmUpHandler({ WU: tree }).handleBlock(
      block,
      input,
      new Set(),
    );

    expect(result).toMatchObject({
      usedBranchIds: ["3", "2", "1", "4"],
    });
  });

  it("draws the possible branch at the floor of the random value times the count", () => {
    const block = generateStrengthTestWarmUpBlock({
      picks: [{ tags: ["UPPER_BODY"], count: 1 }],
    });
    const tree = {
      "1": generateWarmUpBranch("a", ["REGION_UPPER_BODY"]),
      "2": generateWarmUpBranch("b", ["REGION_UPPER_BODY"]),
    };
    const input = generateWorkoutInput({
      exerciseCatalog: generateCatalog(["a", "b"]),
      random: generateSequenceRandom([0.99]),
    });

    const result = createStrengthTestWarmUpHandler({ WU: tree }).handleBlock(
      block,
      input,
      new Set(),
    );

    expect(result).toMatchObject({
      exercises: [{ branchId: "2", exerciseId: "b" }],
    });
  });

  it("falls back to every unused branch when none matches the pick region", () => {
    const block = generateStrengthTestWarmUpBlock({
      picks: [{ tags: ["LOWER_BODY"], count: 1 }],
    });
    const tree = { "1": generateWarmUpBranch("a", ["REGION_CORE"]) };
    const input = generateWorkoutInput({
      exerciseCatalog: generateCatalog(["a"]),
      random: generateSequenceRandom([0]),
    });

    const result = createStrengthTestWarmUpHandler({ WU: tree }).handleBlock(
      block,
      input,
      new Set(),
    );

    expect(result).toMatchObject({
      exercises: [{ branchId: "1", exerciseId: "a" }],
    });
  });

  it("still draws a branch tagged for pain or for equipment the place lacks", () => {
    const block = generateStrengthTestWarmUpBlock({
      picks: [{ tags: ["LOWER_BODY"], count: 1 }],
    });
    const tree = {
      "1": generateWarmUpBranch("a", [
        "REGION_LOWER_BODY",
        "BLOCK_KNEE",
        "EQ_BARBELL",
      ]),
    };
    const input = generateWorkoutInput({
      pains: ["KNEE_LEFT"],
      equipment: [],
      exerciseCatalog: generateCatalog(["a"]),
      random: generateSequenceRandom([0]),
    });

    const result = createStrengthTestWarmUpHandler({ WU: tree }).handleBlock(
      block,
      input,
      new Set(),
    );

    expect(result).toMatchObject({
      exercises: [{ branchId: "1", exerciseId: "a" }],
    });
  });

  it("resolves the exercise at the athlete branch level", () => {
    const block = generateStrengthTestWarmUpBlock({
      picks: [{ tags: [], count: 1 }],
    });
    const tree = {
      "1": generateTreeBranch(
        ["a", "b"],
        ["SKILL_WU", "SIDE_BOTH", "REGION_CORE"],
      ),
    };
    const input = generateWorkoutInput({
      level: "BEGINNER",
      branchLevels: { "1": 2 },
      exerciseCatalog: generateCatalog(["a", "b"]),
      random: generateSequenceRandom([0]),
    });

    const result = createStrengthTestWarmUpHandler({ WU: tree }).handleBlock(
      block,
      input,
      new Set(),
    );

    expect(result).toMatchObject({
      exercises: [{ branchId: "1", exerciseId: "b" }],
    });
  });

  it("counts a drawn branch as used and retries when its exercise is missing from the catalog", () => {
    const block = generateStrengthTestWarmUpBlock({
      picks: [{ tags: ["LOWER_BODY"], count: 1 }],
    });
    const tree = {
      "1": generateWarmUpBranch("missing", ["REGION_LOWER_BODY"]),
      "2": generateWarmUpBranch("b", ["REGION_LOWER_BODY"]),
    };
    const input = generateWorkoutInput({
      exerciseCatalog: generateCatalog(["b"]),
      random: generateSequenceRandom([0, 0]),
    });

    const result = createStrengthTestWarmUpHandler({ WU: tree }).handleBlock(
      block,
      input,
      new Set(),
    );

    expect(result).toEqual({
      status: "filled",
      block,
      exercises: [
        {
          branchId: "2",
          branchTags: tree["2"].tags,
          exerciseId: "b",
        },
      ],
      usedBranchIds: ["1", "2"],
    });
  });

  it("ends empty with a SKILL_TREE reason naming the skill when the tree yields nothing", () => {
    const block = generateStrengthTestWarmUpBlock();
    const input = generateWorkoutInput({
      exerciseCatalog: generateCatalog(["a"]),
      random: generateSequenceRandom([]),
    });

    const result = createStrengthTestWarmUpHandler({ WU: {} }).handleBlock(
      block,
      input,
      new Set(),
    );

    expect(result).toEqual({
      status: "empty",
      block,
      reason: { type: "NO_EXERCISES", subtype: "SKILL_TREE", params: ["WU"] },
      usedBranchIds: [],
    });
  });

  it("draws through input.random and never through Math.random", () => {
    const mathRandom = jest.spyOn(Math, "random");
    const block = generateStrengthTestWarmUpBlock();
    const tree = {
      "1": generateWarmUpBranch("a", ["REGION_LOWER_BODY"]),
      "2": generateWarmUpBranch("b", ["REGION_UPPER_BODY"]),
    };
    const input = generateWorkoutInput({
      exerciseCatalog: generateCatalog(["a", "b"]),
      random: () => 0,
    });

    createStrengthTestWarmUpHandler({ WU: tree }).handleBlock(
      block,
      input,
      new Set(),
    );

    expect(mathRandom).not.toHaveBeenCalled();
  });
});
