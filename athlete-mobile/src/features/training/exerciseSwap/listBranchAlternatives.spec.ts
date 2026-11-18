import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { readTrainingDayWorkout } from "@/features/training/workoutGenerator/trainingDayWorkout";
import { SHORT_WORKOUT_FILTERS } from "@/features/training/workoutGeneratorRouter";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { Logger } from "@/services/Logger";
import {
  type GenerationInputFactoryOptions,
  generateGenerationInput,
} from "@test/factories/generationInput";
import {
  generateLowerBodyBranch,
  generateTwoSidedBranch,
} from "@test/factories/skillTree";
import { generateSessionEntry } from "@test/factories/swapSession";
import {
  generatePicksGenerationInput,
  generateShortWorkout,
  generateSwapWorkout,
} from "@test/factories/swapWorkout";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateShortTemplate,
  generateTemplate,
} from "@test/factories/templateBlock";
import { generateLowerBodyExercises } from "@test/factories/valueExercise";
import { listDistinctSessionBranchIds } from "./swapEntries";
import { listBranchAlternatives } from "./swapWorkout";

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

afterEach(() => {
  jest.restoreAllMocks();
});

describe("listBranchAlternatives: plan day", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("skips the branches and the exercises that the session trains", () => {
    const skillTrees = {
      BAS: {
        "10": generateTwoSidedBranch("e1"),
        // the session trains branch 11
        "11": generateTwoSidedBranch("e2"),
        // branch 20 of the session trains its exercise e3
        "13": generateTwoSidedBranch("e3"),
        "14": generateTwoSidedBranch("e4"),
      },
    };
    const day = generateTemplate([
      generateBranchesBlock("BAS", ["10", "11"], { duration: undefined }),
      generateBranchesBlock("WU", ["20"], { duration: undefined }),
    ]);
    const session = [
      generateSessionEntry("10", "e1", "BAS"),
      generateSessionEntry("11", "e2", "BAS"),
      generateSessionEntry("20", "e3", "WU"),
    ];

    const alternatives = listBranchAlternatives(
      generateSwapWorkout({
        workout: readTrainingDayWorkout(day).workout,
        session,
        input: generateSwapGenerationInput(skillTrees),
        skillTrees,
      }),
      "10",
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual(["14"]);
  });

  it("offers alternatives for a branch shown after an earlier swap, even when the plan day omits the branch", () => {
    const skillTrees = {
      BAS: {
        "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
        "12": generateLowerBodyBranch({ 1: { exerciseId: "e3" } }),
        "13": generateLowerBodyBranch({ 1: { exerciseId: "e4" } }),
      },
    };
    const day = generateTemplate([
      generateBranchesBlock("BAS", ["10"], { duration: undefined }),
    ]);
    const session = [generateSessionEntry("12", "e3", "BAS")];

    const alternatives = listBranchAlternatives(
      generateSwapWorkout({
        workout: readTrainingDayWorkout(day).workout,
        session,
        input: generateSwapGenerationInput(skillTrees),
        skillTrees,
      }),
      "12",
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual([
      "10",
      "11",
      "13",
    ]);
  });

  // The block finder cases live in swapBranchFromWorkout.rejections.spec.ts.
  it("returns an empty list when the block finder finds no block", () => {
    const skillTrees = {
      BAS: {
        "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
    };
    const day = generateTemplate([
      generateBranchesBlock("BAS", ["10"], { duration: undefined }),
    ]);
    const session = [generateSessionEntry("10", "e1", "BAS")];

    const alternatives = listBranchAlternatives(
      generateSwapWorkout({
        workout: readTrainingDayWorkout(day).workout,
        session,
        input: generateSwapGenerationInput(skillTrees),
        skillTrees,
      }),
      "11",
    );

    expect(alternatives).toEqual([]);
  });

  it("returns an empty list when the athlete has muscle soreness in two regions", () => {
    const skillTrees = {
      BAS: {
        "10": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "11": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
    };
    const day = generateTemplate([
      generateBranchesBlock("BAS", ["10"], { duration: undefined }),
    ]);
    const session = [generateSessionEntry("10", "e1", "BAS")];
    const input = generateSwapGenerationInput(skillTrees, {
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });
    const logError = jest.spyOn(Logger, "logError").mockImplementation();

    const alternatives = listBranchAlternatives(
      generateSwapWorkout({
        workout: readTrainingDayWorkout(day).workout,
        session,
        input,
        skillTrees,
      }),
      "10",
    );

    expect([alternatives, logError.mock.calls.length]).toEqual([[], 1]);
    logError.mockRestore();
  });
});

describe("listBranchAlternatives: short workout with a duration block", () => {
  it("offers branches of the CARDIO_2 tree for a cardio duration block", () => {
    const skillTrees = getAllSkillTrees();
    // The listing always filters by equipment. The last draw skips branch 582,
    // which carries no side tag and so matches no other CARDIO_2 branch.
    const input = generateGenerationInput({
      exerciseCatalog: loadExercises(),
      random: () => 0.99,
      equipment: ["EQ_AREA_20", "EQ_AREA_10", "EQ_MARKERS", "EQ_TRACK_20"],
    });
    const workout = generateShortWorkout(
      generateShortTemplate([
        { kind: "duration", skill: "CARDIO_2", duration: 1200 },
      ]),
      input,
      skillTrees,
    );
    const [drawn] = listDistinctSessionBranchIds(workout.session);

    const alternatives = listBranchAlternatives(workout, drawn);

    const cardioTwoIds = Object.keys(skillTrees.CARDIO_2);
    expect(alternatives.length).toBeGreaterThan(0);
    expect(
      alternatives.every(({ branchId }) => cardioTwoIds.includes(branchId)),
    ).toBe(true);
  });
});

describe("listBranchAlternatives: short workout with a picks block", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("skips branches and exercises that the session already trains", () => {
    const template = generateShortTemplate([
      generatePicksBlock("SYN"),
      generateBranchesBlock("OTHER", ["20"], { duration: undefined }),
    ]);
    const skillTrees = {
      T_A: {
        "1": generateTwoSidedBranch("e1"),
        "2": generateTwoSidedBranch("e2"),
        "3": generateTwoSidedBranch("e3"),
        "4": generateTwoSidedBranch("e4"),
      },
    };
    const session = [
      generateSessionEntry("1", "e1", "SYN"),
      // branch 2 is in the session; branch 3 trains e3, the exercise of branch 20
      generateSessionEntry("2", "e2", "SYN"),
      generateSessionEntry("20", "e3", "OTHER"),
    ];

    const alternatives = listBranchAlternatives(
      generateSwapWorkout({
        workout: template,
        session,
        input: generatePicksGenerationInput(),
        skillTrees,
        filters: SHORT_WORKOUT_FILTERS,
      }),
      "1",
    );

    expect(alternatives.map(({ branchId }) => branchId)).toEqual(["4"]);
  });
});
