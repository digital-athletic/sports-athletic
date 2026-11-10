import { generateLowerBodyBranch } from "@test/factories/skillTree";
import {
  listSwappedInBranches,
  listSwapStartLevels,
  toExerciseBranch,
} from "./swapPlan";

/**
 * Builds a swap of the original branch "10" whose one alternative is branch
 * "20" with the exercises 20x1 to 20x3 at levels 1 to 3, e.g.
 * { skill: "SK", position: 1, alternatives: [{ branchId: "20", branch }] }.
 */
const generateSwapToBranch20 = (position: number) => ({
  skill: "SK",
  position,
  originalEntries: [],
  alternatives: [
    {
      branchId: "20",
      branch: generateLowerBodyBranch({
        1: { exerciseId: "20x1" },
        2: { exerciseId: "20x2" },
        3: { exerciseId: "20x3" },
      }),
    },
  ],
});

describe("swapPlan: toExerciseBranch", () => {
  it("names the catalog levels as plan exercises", () => {
    const branch = generateLowerBodyBranch({ 1: { exerciseId: "e1" } });

    expect(toExerciseBranch({ branchId: "7", branch })).toEqual({
      branchId: "7",
      tags: branch.tags,
      exercises: { 1: { exerciseId: "e1" } },
    });
  });
});

describe("swapPlan: listSwapStartLevels", () => {
  it("raises a stored level below the entry level to the entry level", () => {
    expect(
      listSwapStartLevels(
        generateSwapToBranch20(1).alternatives,
        { "20": { branchId: "20", level: 1, exerciseId: "20x1" } },
        "ADVANCED",
      ),
    ).toEqual([{ branchId: "20", level: 2, exerciseId: "20x2" }]);
  });

  it("keeps a stored level above the entry level", () => {
    expect(
      listSwapStartLevels(
        generateSwapToBranch20(1).alternatives,
        { "20": { branchId: "20", level: 3, exerciseId: "20x3" } },
        "ADVANCED",
      ),
    ).toEqual([]);
  });

  it("stores nothing for a branch without a stored level", () => {
    expect(
      listSwapStartLevels(
        generateSwapToBranch20(1).alternatives,
        {},
        "ADVANCED",
      ),
    ).toEqual([]);
  });
});

describe("swapPlan: listSwappedInBranches", () => {
  it("lists the alternative an exercise shows", () => {
    const swap = generateSwapToBranch20(1);

    expect(listSwappedInBranches([swap])).toEqual(swap.alternatives);
  });

  it("lists nothing for an exercise cycled back to its original", () => {
    expect(listSwappedInBranches([generateSwapToBranch20(0)])).toEqual([]);
  });
});
