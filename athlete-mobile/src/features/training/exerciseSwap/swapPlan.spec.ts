import { generateLowerBodyBranch } from "@test/factories/skillTree";
import { collectPlanSwaps, toExerciseBranch } from "./swapPlan";

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

describe("swapPlan: collectPlanSwaps", () => {
  it("collects each exercise moved to an alternative", () => {
    const alternative = {
      branchId: "20",
      branch: generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
    };

    expect(
      collectPlanSwaps({
        "10": { skill: "SK", position: 1, alternatives: [alternative] },
      }),
    ).toEqual([
      {
        skill: "SK",
        originalBranchId: "10",
        branch: toExerciseBranch(alternative),
      },
    ]);
  });

  it("leaves out exercises cycled back to the original", () => {
    const alternative = {
      branchId: "20",
      branch: generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
    };

    expect(
      collectPlanSwaps({
        "10": { skill: "SK", position: 0, alternatives: [alternative] },
      }),
    ).toEqual([]);
  });
});
