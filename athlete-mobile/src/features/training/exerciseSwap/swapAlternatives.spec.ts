import { setUpWorkout } from "@/features/training/workoutGenerator/stages/workoutSetup";
import { resolveWorkoutFilters } from "@/features/training/workoutGenerator/workoutFilters";
import { generateGenerationInput } from "@test/factories/generationInput";
import { generateTreeCatalogEntry } from "@test/factories/skillCatalog";
import {
  generateLowerBodyBranch,
  generateSkillBranch,
} from "@test/factories/skillTree";
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

const listIds = (...args: Parameters<typeof listSwapAlternatives>) =>
  listSwapAlternatives(...args).map(({ branchId }) => branchId);

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

    expect(
      listIds(
        { skill: "BAS", branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
        input,
      ),
    ).toEqual(["2"]);
  });

  it("offers at most three alternatives", () => {
    const input = generateSwapInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
          "3": generateLowerBodyBranch({ 1: { exerciseId: "e3" } }),
          "4": generateLowerBodyBranch({ 1: { exerciseId: "e4" } }),
          "5": generateLowerBodyBranch({ 1: { exerciseId: "e5" } }),
        },
      },
    });

    expect(
      listIds(
        { skill: "BAS", branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
        input,
      ),
    ).toHaveLength(3);
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

    expect(
      listIds(
        {
          skill: "BAS",
          branchId: "1",
          usedBranchIds: ["2"],
          usedExerciseIds: ["e3"],
        },
        input,
      ),
    ).toEqual(["4"]);
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
        },
      },
      pains: ["KNEE_LEFT"],
    });

    expect(
      listIds(
        { skill: "BAS", branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
        input,
      ),
    ).toEqual([]);
  });

  it("offers nothing for a branch outside the skill tree", () => {
    const input = generateSwapInput({
      skillTrees: {
        BAS: { "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }) },
      },
    });

    expect(
      listIds(
        {
          skill: "BAS",
          branchId: "77",
          usedBranchIds: [],
          usedExerciseIds: [],
        },
        input,
      ),
    ).toEqual([]);
  });
});

/**
 * Builds the generation input of a beginner whose catalog holds the exercises
 * e1 to e5 and whose skill catalog holds the skill SYN, which reads the tree
 * T_A without weights, e.g. generatePicksGenerationInput().skillCatalog
 * → { SYN: { skillTree: { withoutWeights: ["T_A"], ... }, ... } }.
 */
const generatePicksGenerationInput = () => ({
  ...generateGenerationInput({
    level: "BEGINNER",
    exerciseCatalog: generateLowerBodyExercises(["e1", "e2", "e3", "e4", "e5"]),
    random: () => 0,
  }),
  skillCatalog: { SYN: generateTreeCatalogEntry() },
});

/**
 * Builds a one sided free branch of the tree T_A with the given tags and one
 * level, e.g. generatePoolBranch(["PICK_A"], "e1")
 * → { tags: ["PICK_A", "SIDE_BOTH"], levels: { 1: { exerciseId: "e1" } } }.
 */
const generatePoolBranch = (tags: string[], exerciseId: string) =>
  generateSkillBranch([...tags, "SIDE_BOTH"], { 1: { exerciseId } });

const listPickIds = (...args: Parameters<typeof listPickSwapAlternatives>) =>
  listPickSwapAlternatives(...args).map(({ branchId }) => branchId);

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
          "1": generatePoolBranch(["PICK_A"], "e1"),
          "2": generatePoolBranch(["PICK_A"], "e2"),
          "3": generatePoolBranch(["PICK_B"], "e3"),
        },
      },
    );

    expect(
      listPickIds(
        { branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
        block,
        input,
      ),
    ).toEqual(["2"]);
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
          "1": generatePoolBranch(["PICK_A", "PICK_B"], "e1"),
          "2": generatePoolBranch(["PICK_A"], "e2"),
          "3": generatePoolBranch(["PICK_B"], "e3"),
        },
      },
    );

    expect(
      listPickIds(
        { branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
        block,
        input,
      ),
    ).toEqual(["2", "3"]);
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
          "1": generatePoolBranch(["PICK_A"], "e1"),
          "2": generatePoolBranch(["PICK_B"], "e2"),
          "3": generatePoolBranch(["PICK_OTHER"], "e3"),
        },
      },
    );

    expect(
      listPickIds(
        { branchId: "3", usedBranchIds: [], usedExerciseIds: [] },
        block,
        input,
      ),
    ).toEqual(["1", "2"]);
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
          "1": generatePoolBranch([], "e1"),
          "2": generatePoolBranch([], "e2"),
          "3": generatePoolBranch([], "e3"),
          "4": generatePoolBranch([], "e4"),
        },
      },
    );

    expect(
      listPickIds(
        { branchId: "1", usedBranchIds: ["2"], usedExerciseIds: ["e3"] },
        block,
        input,
      ),
    ).toEqual(["4"]);
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
          "1": generatePoolBranch([], "e1"),
          "2": generateSkillBranch(["SIDE_ONE"], {
            1: { exerciseId: "e2" },
          }),
        },
      },
    );

    expect(
      listPickIds(
        { branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
        block,
        input,
      ),
    ).toEqual([]);
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
          "1": generateSkillBranch(
            ["REGION_LOWER_BODY", "SIDE_BOTH", "EXERCISE_DIRECTION_HIP"],
            { 1: { exerciseId: "e1" } },
          ),
          "2": generateSkillBranch(
            ["REGION_UPPER_BODY", "SIDE_BOTH", "EXERCISE_DIRECTION_HIP"],
            { 1: { exerciseId: "e2" } },
          ),
          "3": generateSkillBranch(
            ["REGION_LOWER_BODY", "SIDE_BOTH", "EXERCISE_DIRECTION_CORE"],
            { 1: { exerciseId: "e3" } },
          ),
          "4": generateSkillBranch(
            ["REGION_LOWER_BODY", "SIDE_BOTH", "EXERCISE_DIRECTION_HIP"],
            { 1: { exerciseId: "e4" } },
          ),
        },
      },
    );

    expect(
      listPickIds(
        { branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
        block,
        input,
      ),
    ).toEqual(["4", "3", "2"]);
  });

  it("offers nothing for a block that is no picks block", () => {
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
          "1": generatePoolBranch([], "e1"),
          "2": generatePoolBranch([], "e2"),
        },
      },
    );

    expect(
      listPickIds(
        { branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
        branchesBlock,
        input,
      ),
    ).toEqual([]);
  });
});
