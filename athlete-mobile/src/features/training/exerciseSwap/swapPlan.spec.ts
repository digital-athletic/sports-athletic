import { generateLowerBodyBranch } from "@test/factories/skillTree";
import { toExerciseBranch } from "./swapPlan";

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
