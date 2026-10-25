import {
  generateRuleFamilyInput,
  generateSkillTreeBranches,
} from "@test/factories/ruleFamilyInput";
import {
  filterBranchesByEquipment,
  listMissingEquipment,
} from "./equipmentRule";

describe("equipmentRule: filterBranchesByEquipment", () => {
  it("keeps the branches whose equipment the place has", () => {
    const input = generateRuleFamilyInput({ equipment: ["DUMBBELL"] });
    const branches = generateSkillTreeBranches("GKS", ["510", "523"]);

    const result = filterBranchesByEquipment(branches, input);

    expect(Object.keys(result.keep)).toEqual(["510"]);
    expect(result.removals).toEqual([
      { branchId: "523", family: "equipment", details: ["BARBELL"] },
    ]);
    expect(result.replace).toEqual(["FULL_BODY"]);
  });

  it("names the missing equipment of each removed branch", () => {
    const input = generateRuleFamilyInput();
    const branches = generateSkillTreeBranches("GKS", ["510", "523"]);

    const result = filterBranchesByEquipment(branches, input);

    expect(result.keep).toEqual({});
    expect(result.removals).toEqual([
      { branchId: "510", family: "equipment", details: ["DUMBBELL"] },
      { branchId: "523", family: "equipment", details: ["BARBELL"] },
    ]);
    expect(result.replace).toEqual(["UPPER_BODY", "FULL_BODY"]);
  });

  it("removes a branch without levels and requests no replacement", () => {
    const branches = { "1": { tags: ["REGION_UPPER_BODY"] } };

    const result = filterBranchesByEquipment(
      branches,
      generateRuleFamilyInput(),
    );

    expect(result.keep).toEqual({});
    expect(result.removals).toEqual([
      { branchId: "1", family: "equipment", details: [] },
    ]);
    expect(result.replace).toEqual([]);
  });

  it("keeps a branch whose dumbbell and medicine ball stand in for each other", () => {
    const input = generateRuleFamilyInput({ equipment: ["DUMBBELL"] });
    const branches = {
      "1": {
        tags: ["EQ_DUMBBELL", "EQ_MEDICINE_BALL"],
        levels: { 1: { exerciseId: "1" } },
      },
    };

    expect(filterBranchesByEquipment(branches, input).keep).toEqual(branches);
  });

  it("reads the exercising bench exercises of a stored branch", () => {
    const input = generateRuleFamilyInput({ equipment: ["BENCH"] });
    /**
     * Builds a stored day entry that needs an exercising bench.
     *
     * generateStoredBranchEntry("209")
     * → { tags: ["EQ_EXERCISING_BENCH", "REGION_LOWER_BODY"], exercises: { 1: { exerciseId: "209" } } }
     */
    const generateStoredBranchEntry = (exerciseId: string) => ({
      tags: ["EQ_EXERCISING_BENCH", "REGION_LOWER_BODY"],
      exercises: { 1: { exerciseId } },
    });

    const result = filterBranchesByEquipment(
      {
        "1": generateStoredBranchEntry("1"),
        "2": generateStoredBranchEntry("209"),
      },
      input,
    );

    expect(Object.keys(result.keep)).toEqual(["1"]);
    expect(result.removals).toEqual([
      { branchId: "2", family: "equipment", details: ["EXERCISING_BENCH"] },
    ]);
    expect(result.replace).toEqual(["LOWER_BODY"]);
  });
});

describe("equipmentRule: listMissingEquipment", () => {
  it("lists each missing equipment once, in removal order", () => {
    const input = generateRuleFamilyInput();
    const levels = { 1: { exerciseId: "1" } };
    const branches = {
      "1": { tags: ["EQ_BARBELL", "EQ_DUMBBELL"], levels },
      "2": { tags: ["EQ_BARBELL"], levels },
      "3": { tags: ["EQ_TUBE"], levels },
    };

    const { removals } = filterBranchesByEquipment(branches, input);

    expect(listMissingEquipment(removals)).toEqual([
      "BARBELL",
      "DUMBBELL",
      "TUBE",
    ]);
  });

  it("reads only the removals of the equipment family", () => {
    const removals = [
      {
        branchId: "1",
        family: "muscleSoreness" as const,
        details: ["UPPER_BODY"],
      },
      { branchId: "2", family: "equipment" as const, details: ["BARBELL"] },
    ];

    expect(listMissingEquipment(removals)).toEqual(["BARBELL"]);
  });
});
