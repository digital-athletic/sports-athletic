import {
  generateRuleFamilyInput,
  generateSkillTreeBranches,
} from "@test/factories/ruleFamilyInput";
import { generateTaggedBranches } from "@test/factories/skillTree";
import { generateStoredBranch } from "@test/factories/storedBranch";
import {
  filterBranchesByEquipment,
  listMissingEquipment,
} from "./equipmentRule";

describe("equipmentRule: filterBranchesByEquipment", () => {
  it("keeps the branches whose equipment the place has", () => {
    const input = generateRuleFamilyInput({ equipment: ["DUMBBELL"] });
    const branches = generateSkillTreeBranches("GKS", ["510", "523"]);

    const result = filterBranchesByEquipment(branches, input.equipment);

    expect(Object.keys(result.keep)).toEqual(["510"]);
    expect(result.removals).toEqual([
      { branchId: "523", family: "equipment", details: ["BARBELL"] },
    ]);
    expect(result.replace).toEqual(["FULL_BODY"]);
  });

  it("names the missing equipment of each removed branch", () => {
    const input = generateRuleFamilyInput();
    const branches = generateSkillTreeBranches("GKS", ["510", "523"]);

    const result = filterBranchesByEquipment(branches, input.equipment);

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
      generateRuleFamilyInput().equipment,
    );

    expect(result.keep).toEqual({});
    expect(result.removals).toEqual([
      { branchId: "1", family: "equipment", details: [] },
    ]);
    expect(result.replace).toEqual([]);
  });

  it("keeps a branch whose dumbbell and medicine ball stand in for each other", () => {
    const input = generateRuleFamilyInput({ equipment: ["DUMBBELL"] });
    const branches = generateTaggedBranches({
      "1": ["EQ_DUMBBELL", "EQ_MEDICINE_BALL"],
    });

    expect(filterBranchesByEquipment(branches, input.equipment).keep).toEqual(
      branches,
    );
  });

  it("reads the exercising bench exercises of a stored branch", () => {
    const input = generateRuleFamilyInput({ equipment: ["BENCH"] });
    const benchTags = ["EQ_EXERCISING_BENCH", "REGION_LOWER_BODY"];

    const result = filterBranchesByEquipment(
      {
        "1": generateStoredBranch("1", benchTags, "1").branch,
        "2": generateStoredBranch("2", benchTags, "209").branch,
      },
      input.equipment,
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
    const branches = generateTaggedBranches({
      "1": ["EQ_BARBELL", "EQ_DUMBBELL"],
      "2": ["EQ_BARBELL"],
      "3": ["EQ_TUBE"],
    });

    const { removals } = filterBranchesByEquipment(branches, input.equipment);

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
