import { loadExercises } from "@/data/loadExercises";
import {
  generateRuleFamilyInput,
  generateSkillTreeBranches,
} from "../../../../test/factories/ruleFamilyInput";
import { filterBranchesByAgeGroup } from "./ageGroupRule";
import {
  filterBranchesByEquipment,
  listMissingEquipment,
} from "./equipmentRule";
import { filterBranchesByFitnessLevel } from "./fitnessLevelRule";
import { filterBranchesByGender } from "./genderRule";
import { filterBranchesByMuscleSoreness } from "./muscleSorenessRule";
import { filterBranchesByPain } from "./painRule";
import {
  keepBranches,
  listBranchRemovals,
  readReplacementRegion,
  type RuleFamily,
} from "./ruleFamily";

describe("ruleFamily: listBranchRemovals", () => {
  it("lists the candidates missing from keep, in candidate order, with their details", () => {
    const branches = {
      "3": { tags: [] },
      "1": { tags: [] },
      "2": { tags: [] },
    };

    const removals = listBranchRemovals(
      branches,
      { "1": branches["1"] },
      "equipment",
      (branchId) => [`MISSING_${branchId}`],
    );

    expect(removals).toEqual([
      { branchId: "2", family: "equipment", details: ["MISSING_2"] },
      { branchId: "3", family: "equipment", details: ["MISSING_3"] },
    ]);
  });

  it("lists nothing when keep holds every candidate", () => {
    const branches = { "1": { tags: [] } };

    expect(listBranchRemovals(branches, branches, "gender", () => [])).toEqual(
      [],
    );
  });
});

describe("ruleFamily: keepBranches", () => {
  it("keeps the candidates the check accepts, in candidate order, by identity", () => {
    const branches = {
      "1": { tags: ["AGE_CHILD"] },
      "2": { tags: [] },
      "3": { tags: [] },
    };

    const keep = keepBranches(branches, (branch) => branch.tags.length === 0);

    expect(Object.keys(keep)).toEqual(["2", "3"]);
    expect(keep["2"]).toBe(branches["2"]);
  });
});

describe("ruleFamily: readReplacementRegion", () => {
  it("reads the first region tag only", () => {
    expect(
      readReplacementRegion([
        "EQ_DUMBBELL",
        "REGION_FULL_BODY",
        "REGION_LOWER_BODY",
      ]),
    ).toEqual(["FULL_BODY"]);
  });

  it("reads no region for a branch without region tags or tags", () => {
    expect(readReplacementRegion(["EQ_DUMBBELL"])).toEqual([]);
    expect(readReplacementRegion()).toEqual([]);
  });
});

describe("ruleFamily: families chained in the training day order of main", () => {
  it.each([
    [
      "soreness regions before equipment regions",
      { soreMuscles: ["CHEST"], equipment: ["DUMBBELL"] },
    ],
    [
      "equipment regions before fitness level regions",
      { level: "BEGINNER" as const, equipment: ["BARBELL"] },
    ],
  ])("requests the %s", (_, athleteOptions) => {
    const input = generateRuleFamilyInput({
      ...athleteOptions,
      exerciseCatalog: loadExercises(),
    });
    const trainingDayFamilies: RuleFamily[] = [
      filterBranchesByMuscleSoreness,
      filterBranchesByEquipment,
      filterBranchesByFitnessLevel,
    ];
    let branches = generateSkillTreeBranches("GKS", ["510", "523"]);
    const replace: string[] = [];
    for (const filterBranches of trainingDayFamilies) {
      const result = filterBranches(branches, input, "GKS");
      branches = result.keep;
      replace.push(...result.replace);
    }

    expect(branches).toEqual({});
    expect(replace).toEqual(["UPPER_BODY", "FULL_BODY"]);
  });

  it("names only the equipment missing from the branches soreness kept", () => {
    const input = generateRuleFamilyInput({ soreMuscles: ["CHEST"] });
    const branches = generateSkillTreeBranches("GKS", ["510", "523"]);

    const sorenessResult = filterBranchesByMuscleSoreness(
      branches,
      input,
      "GKS",
    );

    const { removals } = filterBranchesByEquipment(sorenessResult.keep, input);

    expect(listMissingEquipment(removals)).toEqual(["BARBELL"]);
  });
});

describe("ruleFamily: families chained in the picks order of main", () => {
  it("removes each branch with the first family that blocks it", () => {
    const input = generateRuleFamilyInput({
      gender: "FEMALE",
      pains: ["KNEE_LEFT"],
    });
    const picksFamilies: RuleFamily[] = [
      filterBranchesByPain,
      filterBranchesByEquipment,
      filterBranchesByAgeGroup,
      filterBranchesByGender,
    ];
    let branches = {
      ...generateSkillTreeBranches("GKS", ["510", "523"]),
      ...generateSkillTreeBranches("WU", ["1026"]),
    };
    const removals: [string, string][] = [];
    for (const filterBranches of picksFamilies) {
      const result = filterBranches(branches, input, "WU");
      branches = result.keep;
      removals.push(
        ...result.removals.map(({ branchId, family }): [string, string] => [
          branchId,
          family,
        ]),
      );
    }

    expect(branches).toEqual({});
    expect(removals).toEqual([
      ["523", "pain"],
      ["510", "equipment"],
      ["1026", "gender"],
    ]);
  });
});
