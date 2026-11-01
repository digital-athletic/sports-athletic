import { generateDerivedProfile } from "@test/factories/derivedProfile";
import {
  generatePlanAthlete,
  generatePlanGenerationInput,
} from "@test/factories/planGenerationInput";
import { generateTaggedBranches } from "@test/factories/skillTree";
import { applyBranchRuleChain } from "./branchRuleChain";

const ownExercise = { 1: { exerciseId: "e1" } };
const fieldPlayer = generateDerivedProfile();

describe("branchRuleChain: applyBranchRuleChain", () => {
  it("filters by used branches, age group, gender, equipment, pain and goalkeeper exclusion in this order", () => {
    const input = generatePlanGenerationInput({
      athlete: generatePlanAthlete({
        tags: { LEVEL: ["ADVANCED"], PAIN: ["KNEE_LEFT"] },
      }),
    });
    const candidates = generateTaggedBranches(
      {
        "1": ["POSITION_GOAL"],
        "2": ["BLOCK_KNEE"],
        "3": ["EQ_BARBELL"],
        "4": ["GENDER_FEMALE", "BLOCK_KNEE"],
        "5": ["AGE_CHILD", "GENDER_FEMALE"],
        "6": ["AGE_CHILD"],
        "7": [],
      },
      ownExercise,
    );

    const result = applyBranchRuleChain(
      candidates,
      { place: "HOME", usedBranchIds: ["6"] },
      fieldPlayer,
      input,
    );

    expect(Object.keys(result.keep)).toEqual(["7"]);
    expect(
      result.removals.map(({ branchId, family }) => [branchId, family]),
    ).toEqual([
      ["6", "usedBranch"],
      ["5", "ageGroup"],
      ["4", "gender"],
      ["3", "equipment"],
      ["2", "pain"],
      ["1", "goalkeeper"],
    ]);
  });

  it("applies the equipment of the training place of each day", () => {
    const input = generatePlanGenerationInput();
    const candidates = generateTaggedBranches(
      { "1": ["EQ_DUMBBELL"], "2": ["EQ_BARBELL"] },
      ownExercise,
    );
    const keepAt = (place: "HOME" | "STUDIO"): string[] =>
      Object.keys(
        applyBranchRuleChain(
          candidates,
          { place, usedBranchIds: [] },
          fieldPlayer,
          input,
        ).keep,
      );

    expect(keepAt("HOME")).toEqual(["1"]);
    expect(keepAt("STUDIO")).toEqual(["2"]);
  });
});
