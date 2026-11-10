import {
  generateLowerBodyBranch,
  generateSkillBranch,
} from "@test/factories/skillTree";
import { generateLowerBodyExercises } from "@test/factories/valueExercise";
import { generateWorkoutInput } from "@test/factories/workoutInput";
import { listSwapAlternatives } from "./swapAlternatives";

/**
 * Builds the input of a beginner whose catalog holds the exercises e1 to e5,
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

  it("ranks the same body region and movement direction first", () => {
    const input = generateSwapInput({
      skillTrees: {
        BAS: {
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
    });

    expect(
      listIds(
        { skill: "BAS", branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
        input,
      ),
    ).toEqual(["4", "3", "2"]);
  });

  it("skips branches with the other side setting", () => {
    const input = generateSwapInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }, [
            "SIDE_ONE",
          ]),
        },
      },
    });

    expect(
      listIds(
        { skill: "BAS", branchId: "1", usedBranchIds: [], usedExerciseIds: [] },
        input,
      ),
    ).toEqual([]);
  });

  it("skips branches and exercises the session already holds", () => {
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
