import { generateGenerationInput } from "../../../../test/factories/generationInput";
import { generateStoredBranch } from "../../../../test/factories/storedBranch";
import { refillBranchSlots, splitDuplicateBranches } from "./duplicateBranches";
import { setUpWorkout } from "./workoutSetup";

describe("duplicateBranches: splitDuplicateBranches", () => {
  const input = setUpWorkout(generateGenerationInput());

  it("keeps the first holder of an exercise and asks for the region of each later holder", () => {
    const kept = [
      generateStoredBranch("1", ["REGION_UPPER_BODY"], "336"),
      generateStoredBranch("2", ["REGION_LOWER_BODY"], "16"),
      generateStoredBranch("3", ["REGION_CORE"], "336"),
      generateStoredBranch("4", ["REGION_FULL_BODY"], "336"),
    ];

    expect(splitDuplicateBranches(kept, input)).toEqual({
      unique: [kept[0], kept[1]],
      duplicateRegions: ["CORE", "FULL_BODY"],
    });
  });

  it("drops a later holder without a region tag and asks for no region", () => {
    const kept = [
      generateStoredBranch("1", ["REGION_UPPER_BODY"], "336"),
      generateStoredBranch("2", [], "336"),
    ];

    expect(splitDuplicateBranches(kept, input)).toEqual({
      unique: [kept[0]],
      duplicateRegions: [],
    });
  });

  it("never counts a branch without a resolved exercise as a duplicate", () => {
    const kept = [
      generateStoredBranch("5", ["REGION_CORE"], "10", { exercises: {} }),
      generateStoredBranch("6", ["REGION_CORE"], "10", { exercises: {} }),
    ];

    expect(splitDuplicateBranches(kept, input)).toEqual({
      unique: kept,
      duplicateRegions: [],
    });
  });

  it("reads the levels of a catalog branch when the branch has no stored exercises", () => {
    const catalogOverrides = {
      exercises: undefined,
      levels: { "2": { exerciseId: "336" } },
    };
    const kept = [
      generateStoredBranch("1", [], "10", catalogOverrides),
      generateStoredBranch("2", [], "10", catalogOverrides),
    ];

    expect(splitDuplicateBranches(kept, input).unique).toEqual([kept[0]]);
  });

  it("resolves each branch at the athlete's own branch level", () => {
    const levelOneInput = setUpWorkout(
      generateGenerationInput({ branchLevels: { "2": 1 } }),
    );
    const kept = [
      generateStoredBranch("1", ["REGION_CORE"], "336"),
      generateStoredBranch("2", ["REGION_CORE"], "336", {
        exercises: { "1": { exerciseId: "16" }, "2": { exerciseId: "336" } },
      }),
    ];

    expect(splitDuplicateBranches(kept, levelOneInput).unique).toEqual(kept);
    expect(splitDuplicateBranches(kept, input).unique).toEqual([kept[0]]);
  });
});

describe("duplicateBranches: refillBranchSlots", () => {
  it("hands each slot the kept branches and the branches earlier slots added", () => {
    const kept = [generateStoredBranch("1", [], "10")];
    const seen: string[][] = [];

    refillBranchSlots(["CORE", "CORE"], kept, (usedBranchIds, region) => {
      seen.push(usedBranchIds);
      return generateStoredBranch(`${region}${seen.length}`, [], "20");
    });

    expect(seen).toEqual([["1"], ["1", "CORE1"]]);
  });

  it("drops a slot without a branch and keeps the others", () => {
    const kept = [generateStoredBranch("1", [], "10")];

    const added = refillBranchSlots(
      ["UPPER_BODY", "CORE", "LOWER_BODY"],
      kept,
      (_usedBranchIds, region) =>
        region === "CORE" ? undefined : generateStoredBranch(region, [], "20"),
    );

    expect(added.map(({ branchId }) => branchId)).toEqual([
      "UPPER_BODY",
      "LOWER_BODY",
    ]);
  });
});
