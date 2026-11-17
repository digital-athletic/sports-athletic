import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import type { TrainingDay } from "@/features/training/workoutGenerator/trainingDayWorkout";
import type { Block, Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { Logger } from "@/services/Logger";
import {
  type GenerationInputFactoryOptions,
  generateGenerationInput,
} from "@test/factories/generationInput";
import { generateTreeCatalogEntry } from "@test/factories/skillCatalog";
import {
  generateKneeSkillTrees,
  generateLowerBodyBranch,
  generateSkillBranch,
} from "@test/factories/skillTree";
import { generateStoredTrainingDay } from "@test/factories/storedTrainingDay";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateShortTemplate,
  generateTemplate,
} from "@test/factories/templateBlock";
import { generateLowerBodyExercises } from "@test/factories/valueExercise";
import {
  getBranchReplacement,
  type SwapWorkout,
  type SwapWorkoutSource,
} from "./swapWorkout";

/**
 * Builds a session entry of a branch, e.g. generateSessionEntry("10", "e1", "BAS")
 * → { branchId: "10", exerciseId: "e1", skill: "BAS", set: [1, 1], repetition: 8 }.
 */
const generateSessionEntry = (
  branchId: string,
  exerciseId: string,
  skill: string,
): UserExerciseDataType => ({
  branchId,
  exerciseId,
  skill,
  set: [1, 1],
  repetition: 8,
});

/**
 * Builds the generation input of a beginner whose catalog contains the lower body
 * exercises e1 to e9 and whose draws always return 0, with the branch lookup
 * index over the given trees, e.g. generateSwapGenerationInput({ BAS: { "1": branch } }).
 */
const generateSwapGenerationInput = (
  skillTrees: Record<string, SkillTreeType>,
  options: GenerationInputFactoryOptions = {},
): GenerationInput =>
  generateGenerationInput({
    level: "BEGINNER",
    exerciseCatalog: generateLowerBodyExercises([
      "e1",
      "e2",
      "e3",
      "e4",
      "e5",
      "e6",
      "e7",
      "e8",
      "e9",
    ]),
    random: () => 0,
    skillTrees,
    ...options,
  });

/**
 * Builds the generation input of a short workout with picks blocks: the input
 * of generateSwapGenerationInput without an index, and a skill catalog whose
 * skill SYN reads the tree T_A, e.g. generatePicksGenerationInput().skillCatalog
 * → { SYN: { skillTree: { withoutWeights: ["T_A"], ... }, ... } }.
 */
const generatePicksGenerationInput = (): GenerationInput => ({
  ...generateSwapGenerationInput({}, { skillTrees: undefined }),
  skillCatalog: { SYN: generateTreeCatalogEntry() },
});

/**
 * Builds a branch of the tree T_A with the given tags and one level, e.g.
 * generatePoolBranch(["PICK_A"], "e1")
 * → { tags: ["PICK_A", "SIDE_BOTH"], levels: { 1: { exerciseId: "e1" } } }.
 */
const generatePoolBranch = (tags: string[], exerciseId: string) =>
  generateSkillBranch([...tags, "SIDE_BOTH"], { 1: { exerciseId } });

/**
 * Builds a lower body branch of one exercise with a movement direction, e.g.
 * generateDirectedBranch("e4", "CORE", "REGION_LOWER_BODY")
 * → { tags: [<region>, "SIDE_BOTH", "EXERCISE_DIRECTION_CORE"], levels: { 1: { exerciseId: "e4" } } }.
 */
const generateDirectedBranch = (
  exerciseId: string,
  direction: string,
  region = "REGION_LOWER_BODY",
) =>
  generateSkillBranch(
    [region, "SIDE_BOTH", `EXERCISE_DIRECTION_${direction}`],
    { 1: { exerciseId } },
  );

/**
 * Builds the swap workout of a source, e.g. generateSwapWorkout({ kind: "plan", day }, session, trees, input)
 * → { session, source: { kind: "plan", day }, input, skillTrees: trees }.
 */
const generateSwapWorkout = (
  source: SwapWorkoutSource,
  session: UserExerciseDataType[],
  skillTrees: Record<string, SkillTreeType>,
  input: GenerationInput = generateSwapGenerationInput(skillTrees),
): SwapWorkout => ({ session, source, input, skillTrees });

/**
 * Builds a plan day, e.g. generatePlanDay([generateBranchesBlock("BAS", ["10"])])
 * → { aiwl: 1, id: "day", blocks: [{ kind: "branches", skill: "BAS", branches: ["10"] }], ... }.
 */
const generatePlanDay = (blocks: Block[]): TrainingDay =>
  generateTemplate(blocks);

/** Lists the branch IDs of the replacements of a target, e.g. ["11", "12"]. */
const listIds = (...args: Parameters<typeof getBranchReplacement>): string[] =>
  getBranchReplacement(...args).map(({ branchId }) => branchId);

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getBranchReplacement: plan day", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("offers at most three branches, closest by body region and movement direction first, skipping branches and exercises of the session", () => {
    const skillTrees = {
      BAS: {
        "10": generateDirectedBranch("e1", "HIP"),
        // the session trains branch 11
        "11": generateDirectedBranch("e2", "HIP"),
        // branch 20 of the session trains its exercise e3
        "13": generateDirectedBranch("e3", "HIP"),
        "14": generateDirectedBranch("e4", "HIP"),
        "15": generateDirectedBranch("e5", "CORE"),
        "16": generateDirectedBranch("e6", "HIP", "REGION_UPPER_BODY"),
        "17": generateDirectedBranch("e7", "CORE", "REGION_UPPER_BODY"),
      },
    };
    const day = generatePlanDay([
      generateBranchesBlock("BAS", ["10", "11"], { duration: undefined }),
      generateBranchesBlock("WU", ["20"], { duration: undefined }),
    ]);
    const session = [
      generateSessionEntry("10", "e1", "BAS"),
      generateSessionEntry("11", "e2", "BAS"),
      generateSessionEntry("20", "e3", "WU"),
    ];

    const replacements = listIds(
      generateSwapWorkout({ kind: "plan", day }, session, skillTrees),
      "10",
    );

    expect(replacements).toEqual(["14", "15", "16"]);
  });

  it("offers branches of the skill tree of the target for a legacy stored day", () => {
    const skillTrees = {
      BAS: {
        "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
    };
    const day = generateStoredTrainingDay({ BAS: ["10"] });
    const session = [generateSessionEntry("10", "e1", "BAS")];

    const replacements = listIds(
      generateSwapWorkout({ kind: "plan", day }, session, skillTrees),
      "10",
    );

    expect(replacements).toEqual(["11"]);
  });

  it("offers replacements for a branch shown after an earlier swap, although the plan day does not list the branch", () => {
    const skillTrees = {
      BAS: {
        "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
        "12": generateLowerBodyBranch({ 1: { exerciseId: "e3" } }),
        "13": generateLowerBodyBranch({ 1: { exerciseId: "e4" } }),
      },
    };
    const day = generatePlanDay([
      generateBranchesBlock("BAS", ["10"], { duration: undefined }),
    ]);
    const session = [generateSessionEntry("12", "e3", "BAS")];

    const replacements = listIds(
      generateSwapWorkout({ kind: "plan", day }, session, skillTrees),
      "12",
    );

    expect(replacements).toEqual(["10", "11", "13"]);
  });

  it("returns an empty list for a target outside the session", () => {
    const skillTrees = {
      BAS: {
        "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
    };
    const day = generatePlanDay([
      generateBranchesBlock("BAS", ["10"], { duration: undefined }),
    ]);
    const session = [generateSessionEntry("10", "e1", "BAS")];

    const replacements = listIds(
      generateSwapWorkout({ kind: "plan", day }, session, skillTrees),
      "11",
    );

    expect(replacements).toEqual([]);
  });

  it("returns an empty list for the placeholder branch of a pause", () => {
    const skillTrees = {
      BAS: { "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }) },
    };
    const day = generatePlanDay([
      generateBranchesBlock("BAS", ["10"], { duration: undefined }),
    ]);
    const session = [
      generateSessionEntry("10", "e1", "BAS"),
      generateSessionEntry("-1", "999999", "BAS"),
    ];

    const replacements = listIds(
      generateSwapWorkout({ kind: "plan", day }, session, skillTrees),
      "-1",
    );

    expect(replacements).toEqual([]);
  });

  it("returns an empty list for a branch the session trains under two skills", () => {
    const skillTrees = {
      BAS: {
        "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
    };
    const day = generatePlanDay([
      generateBranchesBlock("BAS", ["10"], { duration: undefined }),
      generateBranchesBlock("WU", ["10"], { duration: undefined }),
    ]);
    const session = [
      generateSessionEntry("10", "e1", "BAS"),
      generateSessionEntry("10", "e1", "WU"),
    ];

    const replacements = listIds(
      generateSwapWorkout({ kind: "plan", day }, session, skillTrees),
      "10",
    );

    expect(replacements).toEqual([]);
  });

  it("returns an empty list for a skill with only a duration block", () => {
    const skillTrees = {
      BAS: {
        "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
    };
    const day = generatePlanDay([
      { kind: "duration", skill: "BAS", duration: 600 },
    ]);
    const session = [generateSessionEntry("10", "e1", "BAS")];

    const replacements = listIds(
      generateSwapWorkout({ kind: "plan", day }, session, skillTrees),
      "10",
    );

    expect(replacements).toEqual([]);
  });

  it("returns an empty list for a target outside the skill tree", () => {
    const skillTrees = {
      BAS: { "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }) },
    };
    const day = generatePlanDay([
      generateBranchesBlock("BAS", ["77"], { duration: undefined }),
    ]);
    const session = [generateSessionEntry("77", "e1", "BAS")];

    const replacements = listIds(
      generateSwapWorkout({ kind: "plan", day }, session, skillTrees),
      "77",
    );

    expect(replacements).toEqual([]);
  });

  it("returns an empty list when the athlete has muscle soreness in two regions", () => {
    const skillTrees = {
      BAS: {
        "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
    };
    const day = generatePlanDay([
      generateBranchesBlock("BAS", ["10"], { duration: undefined }),
    ]);
    const session = [generateSessionEntry("10", "e1", "BAS")];
    const input = generateSwapGenerationInput(skillTrees, {
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });
    const logError = jest.spyOn(Logger, "logError").mockImplementation();

    const replacements = listIds(
      generateSwapWorkout({ kind: "plan", day }, session, skillTrees, input),
      "10",
    );

    expect([replacements, logError.mock.calls.length]).toEqual([[], 1]);
    logError.mockRestore();
  });
});

describe("getBranchReplacement: short workout with a branches block", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("offers other branches of the skill tree of the target", () => {
    const skillTrees = {
      BAS: {
        "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
        "12": generateLowerBodyBranch({ 1: { exerciseId: "e3" } }),
      },
    };
    const template = generateShortTemplate([
      generateBranchesBlock("BAS", ["10"], { duration: undefined }),
    ]);
    const session = [generateSessionEntry("10", "e1", "BAS")];

    const replacements = listIds(
      generateSwapWorkout({ kind: "short", template }, session, skillTrees),
      "10",
    );

    expect(replacements).toEqual(["11", "12"]);
  });
});

describe("getBranchReplacement: short workout with a picks block", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const generatePicksWorkout = (
    template: Template,
    session: UserExerciseDataType[],
    skillTrees: Record<string, SkillTreeType>,
  ): SwapWorkout =>
    generateSwapWorkout(
      { kind: "short", template },
      session,
      skillTrees,
      generatePicksGenerationInput(),
    );

  it("offers the branches of the pick that the target matches", () => {
    const template = generateShortTemplate([
      generatePicksBlock("SYN", {
        picks: [
          { tags: ["PICK_A"], count: 1 },
          { tags: ["PICK_B"], count: 1 },
        ],
      }),
    ]);
    const skillTrees = {
      T_A: {
        "1": generatePoolBranch(["PICK_A"], "e1"),
        "2": generatePoolBranch(["PICK_A"], "e2"),
        "3": generatePoolBranch(["PICK_B"], "e3"),
      },
    };
    const session = [generateSessionEntry("1", "e1", "SYN")];

    const replacements = listIds(
      generatePicksWorkout(template, session, skillTrees),
      "1",
    );

    expect(replacements).toEqual(["2"]);
  });

  it("offers the whole block pool when the target matches no pick", () => {
    const template = generateShortTemplate([
      generatePicksBlock("SYN", {
        picks: [
          { tags: ["PICK_A"], count: 1 },
          { tags: ["PICK_B"], count: 1 },
        ],
        fallbackToWholeTree: true,
      }),
    ]);
    const skillTrees = {
      T_A: {
        "1": generatePoolBranch(["PICK_A"], "e1"),
        "2": generatePoolBranch(["PICK_B"], "e2"),
        "3": generatePoolBranch(["PICK_OTHER"], "e3"),
      },
    };
    const session = [generateSessionEntry("3", "e3", "SYN")];

    const replacements = listIds(
      generatePicksWorkout(template, session, skillTrees),
      "3",
    );

    expect(replacements).toEqual(["1", "2"]);
  });

  it("skips branches and exercises that the session already trains", () => {
    const template = generateShortTemplate([
      generatePicksBlock("SYN"),
      generateBranchesBlock("OTHER", ["20"], { duration: undefined }),
    ]);
    const skillTrees = {
      T_A: {
        "1": generatePoolBranch([], "e1"),
        "2": generatePoolBranch([], "e2"),
        "3": generatePoolBranch([], "e3"),
        "4": generatePoolBranch([], "e4"),
      },
    };
    const session = [
      generateSessionEntry("1", "e1", "SYN"),
      // branch 2 is in the session; branch 3 trains e3, the exercise of branch 20
      generateSessionEntry("2", "e2", "SYN"),
      generateSessionEntry("20", "e3", "OTHER"),
    ];

    const replacements = listIds(
      generatePicksWorkout(template, session, skillTrees),
      "1",
    );

    expect(replacements).toEqual(["4"]);
  });

  it("returns an empty list when the short template contains the skill in two blocks", () => {
    const template = generateShortTemplate([
      generatePicksBlock("SYN"),
      generatePicksBlock("SYN"),
    ]);
    const skillTrees = {
      T_A: {
        "1": generatePoolBranch([], "e1"),
        "2": generatePoolBranch([], "e2"),
      },
    };
    const session = [generateSessionEntry("1", "e1", "SYN")];

    const replacements = listIds(
      generatePicksWorkout(template, session, skillTrees),
      "1",
    );

    expect(replacements).toEqual([]);
  });

  it("returns an empty list for a target outside the block pool", () => {
    const template = generateShortTemplate([generatePicksBlock("SYN")]);
    const skillTrees = {
      T_A: {
        "1": generatePoolBranch([], "e1"),
        "2": generatePoolBranch([], "e2"),
      },
    };
    const session = [generateSessionEntry("9", "e9", "SYN")];

    const replacements = listIds(
      generatePicksWorkout(template, session, skillTrees),
      "9",
    );

    expect(replacements).toEqual([]);
  });

  it("returns an empty list when the setup of the short template throws", () => {
    const skillTrees = generateKneeSkillTrees();
    const template = generateShortTemplate([generatePicksBlock("BAS")]);
    const session = [generateSessionEntry("1", "e1", "BAS")];
    const input = generateSwapGenerationInput(skillTrees, {
      pains: ["KNEE_LEFT"],
    });
    const logError = jest.spyOn(Logger, "logError").mockImplementation();

    const replacements = listIds(
      generateSwapWorkout(
        { kind: "short", template },
        session,
        skillTrees,
        input,
      ),
      "1",
    );

    expect([replacements, logError.mock.calls.length]).toEqual([[], 1]);
    logError.mockRestore();
  });
});
