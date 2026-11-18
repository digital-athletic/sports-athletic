import { setUpWorkout } from "@/features/training/workoutGenerator/stages/workoutSetup";
import { resolveWorkoutFilters } from "@/features/training/workoutGenerator/workoutFilters";
import {
  generateLowerBodyBranch,
  generateSkillBranch,
  generateTwoSidedBranch,
} from "@test/factories/skillTree";
import { generatePicksGenerationInput } from "@test/factories/swapWorkout";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { generateLowerBodyExercises } from "@test/factories/valueExercise";
import { generateWorkoutInput } from "@test/factories/workoutInput";
import {
  listPickSwapAlternatives,
  listSwapAlternatives,
} from "./swapAlternatives";

/**
 * Builds the input of a beginner whose catalog contains the exercises e1 to e5,
 * e.g. generateSwapInput({ skillTrees: { BAS: { "1": branch } } }).
 */
const generateSwapInput = (
  options: Parameters<typeof generateWorkoutInput>[0] = {},
) =>
  generateWorkoutInput({
    level: "BEGINNER",
    exerciseCatalog: generateLowerBodyExercises(["e1", "e2", "e3", "e4", "e5"]),
    random: () => 0,
    ...options,
  });

describe("swapAlternatives: listSwapAlternatives", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("offers other branches of the same skill tree", () => {
    const input = generateSwapInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
        },
        MOB: { "9": generateLowerBodyBranch({ 1: { exerciseId: "e3" } }) },
      },
    });

    const alternatives = listSwapAlternatives(
      { skill: "BAS", branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
      input,
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual(["2"]);
  });

  // The branch IDs run against the ranking, so the tree order cannot give it.
  it("ranks the same body region and movement direction first", () => {
    const input = generateSwapInput({
      skillTrees: {
        BAS: {
          "1": generateTwoSidedBranch("e1", [
            "REGION_LOWER_BODY",
            "EXERCISE_DIRECTION_HIP",
          ]),
          "2": generateTwoSidedBranch("e2", [
            "REGION_UPPER_BODY",
            "EXERCISE_DIRECTION_CORE",
          ]),
          "3": generateTwoSidedBranch("e3", [
            "REGION_UPPER_BODY",
            "EXERCISE_DIRECTION_HIP",
          ]),
          "4": generateTwoSidedBranch("e4", [
            "REGION_LOWER_BODY",
            "EXERCISE_DIRECTION_CORE",
          ]),
          "5": generateTwoSidedBranch("e5", [
            "REGION_LOWER_BODY",
            "EXERCISE_DIRECTION_HIP",
          ]),
        },
      },
    });

    const alternatives = listSwapAlternatives(
      { skill: "BAS", branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
      input,
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual([
      "5",
      "4",
      "3",
      "2",
    ]);
  });

  it("skips branches and exercises that are already in the session", () => {
    const input = generateSwapInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
          "3": generateLowerBodyBranch({ 1: { exerciseId: "e3" } }),
          "4": generateLowerBodyBranch({ 1: { exerciseId: "e4" } }),
        },
      },
    });

    const alternatives = listSwapAlternatives(
      {
        skill: "BAS",
        branchId: "1",
        usedBranchIds: ["2"],
        usedExerciseIds: ["e3"],
      },
      input,
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual(["4"]);
  });

  // The other replacement filters run through filterReplacementBranches,
  // whose cases branchReplacement.spec.ts tests.
  it("skips branches blocked by the athlete's pain", () => {
    const input = generateSwapInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }, [
            "SIDE_BOTH",
            "BLOCK_KNEE",
          ]),
          "3": generateLowerBodyBranch({ 1: { exerciseId: "e3" } }),
        },
      },
      pains: ["KNEE_LEFT"],
    });

    const alternatives = listSwapAlternatives(
      { skill: "BAS", branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
      input,
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual(["3"]);
  });

  it("offers nothing for a branch outside the skill tree", () => {
    const input = generateSwapInput({
      skillTrees: {
        BAS: { "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }) },
      },
    });

    const alternatives = listSwapAlternatives(
      {
        skill: "BAS",
        branchId: "77",
        usedBranchIds: [],
        usedExerciseIds: [],
      },
      input,
    );

    expect(alternatives).toEqual([]);
  });
});

describe("swapAlternatives: listPickSwapAlternatives", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("offers the branches that match the tags of the pick that drew the original", () => {
    const block = generatePicksBlock("SYN", {
      picks: [
        { tags: ["PICK_A"], count: 1 },
        { tags: ["PICK_B"], count: 1 },
      ],
    });
    const template = generateTemplate([block]);
    const input = setUpWorkout(
      generatePicksGenerationInput(),
      resolveWorkoutFilters({ soreness: false }),
      template,
      {
        T_A: {
          "1": generateTwoSidedBranch("e1", ["PICK_A"]),
          "2": generateTwoSidedBranch("e2", ["PICK_A"]),
          "3": generateTwoSidedBranch("e3", ["PICK_B"]),
        },
      },
    );

    const alternatives = listPickSwapAlternatives(
      { branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
      block,
      input,
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual(["2"]);
  });

  it("offers the branches of every pick that matches the original", () => {
    const block = generatePicksBlock("SYN", {
      picks: [
        { tags: ["PICK_A"], count: 1 },
        { tags: ["PICK_B"], count: 1 },
      ],
    });
    const template = generateTemplate([block]);
    const input = setUpWorkout(
      generatePicksGenerationInput(),
      resolveWorkoutFilters({ soreness: false }),
      template,
      {
        T_A: {
          "1": generateTwoSidedBranch("e1", ["PICK_A", "PICK_B"]),
          "2": generateTwoSidedBranch("e2", ["PICK_A"]),
          "3": generateTwoSidedBranch("e3", ["PICK_B"]),
        },
      },
    );

    const alternatives = listPickSwapAlternatives(
      { branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
      block,
      input,
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual(["2", "3"]);
  });

  it("falls back to the whole block pool when the original matches no pick", () => {
    const block = generatePicksBlock("SYN", {
      picks: [
        { tags: ["PICK_A"], count: 1 },
        { tags: ["PICK_B"], count: 1 },
      ],
      fallbackToWholeTree: true,
    });
    const template = generateTemplate([block]);
    const input = setUpWorkout(
      generatePicksGenerationInput(),
      resolveWorkoutFilters({ soreness: false }),
      template,
      {
        T_A: {
          "1": generateTwoSidedBranch("e1", ["PICK_A"]),
          "2": generateTwoSidedBranch("e2", ["PICK_B"]),
          "3": generateTwoSidedBranch("e3", ["PICK_OTHER"]),
        },
      },
    );

    const alternatives = listPickSwapAlternatives(
      { branchId: "3", usedBranchIds: [], usedExerciseIds: [] },
      block,
      input,
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual(["1", "2"]);
  });

  it("skips branches and exercises that are already in the session", () => {
    const block = generatePicksBlock("SYN");
    const template = generateTemplate([block]);
    const input = setUpWorkout(
      generatePicksGenerationInput(),
      resolveWorkoutFilters({ soreness: false }),
      template,
      {
        T_A: {
          "1": generateTwoSidedBranch("e1"),
          "2": generateTwoSidedBranch("e2"),
          "3": generateTwoSidedBranch("e3"),
          "4": generateTwoSidedBranch("e4"),
        },
      },
    );

    const alternatives = listPickSwapAlternatives(
      { branchId: "1", usedBranchIds: ["2"], usedExerciseIds: ["e3"] },
      block,
      input,
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual(["4"]);
  });

  it("skips branches with the other side setting", () => {
    const block = generatePicksBlock("SYN");
    const template = generateTemplate([block]);
    const input = setUpWorkout(
      generatePicksGenerationInput(),
      resolveWorkoutFilters({ soreness: false }),
      template,
      {
        T_A: {
          "1": generateTwoSidedBranch("e1"),
          "2": generateSkillBranch(["SIDE_ONE"], {
            1: { exerciseId: "e2" },
          }),
        },
      },
    );

    const alternatives = listPickSwapAlternatives(
      { branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
      block,
      input,
    );

    expect(alternatives).toEqual([]);
  });

  it("ranks the same body region and movement direction first", () => {
    const block = generatePicksBlock("SYN");
    const template = generateTemplate([block]);
    const input = setUpWorkout(
      generatePicksGenerationInput(),
      resolveWorkoutFilters({ soreness: false }),
      template,
      {
        T_A: {
          "1": generateTwoSidedBranch("e1", [
            "REGION_LOWER_BODY",
            "EXERCISE_DIRECTION_HIP",
          ]),
          "2": generateTwoSidedBranch("e2", [
            "REGION_UPPER_BODY",
            "EXERCISE_DIRECTION_HIP",
          ]),
          "3": generateTwoSidedBranch("e3", [
            "REGION_LOWER_BODY",
            "EXERCISE_DIRECTION_CORE",
          ]),
          "4": generateTwoSidedBranch("e4", [
            "REGION_LOWER_BODY",
            "EXERCISE_DIRECTION_HIP",
          ]),
        },
      },
    );

    const alternatives = listPickSwapAlternatives(
      { branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
      block,
      input,
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual([
      "4",
      "3",
      "2",
    ]);
  });

  it("offers nothing for a branch outside the block pool", () => {
    const block = generatePicksBlock("SYN");
    const template = generateTemplate([block]);
    const input = setUpWorkout(
      generatePicksGenerationInput(),
      resolveWorkoutFilters({ soreness: false }),
      template,
      {
        T_A: {
          "1": generateTwoSidedBranch("e1"),
          "2": generateTwoSidedBranch("e2"),
        },
      },
    );

    const alternatives = listPickSwapAlternatives(
      { branchId: "9", usedBranchIds: [], usedExerciseIds: [] },
      block,
      input,
    );

    expect(alternatives).toEqual([]);
  });

  it("offers nothing for a block other than a picks block", () => {
    const branchesBlock = generateBranchesBlock("OTHER", ["1"], {
      duration: undefined,
    });
    const template = generateTemplate([
      generatePicksBlock("SYN"),
      branchesBlock,
    ]);
    const input = setUpWorkout(
      generatePicksGenerationInput(),
      resolveWorkoutFilters({ soreness: false }),
      template,
      {
        T_A: {
          "1": generateTwoSidedBranch("e1"),
          "2": generateTwoSidedBranch("e2"),
        },
      },
    );

    const alternatives = listPickSwapAlternatives(
      { branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
      branchesBlock,
      input,
    );

    expect(alternatives).toEqual([]);
  });
});
