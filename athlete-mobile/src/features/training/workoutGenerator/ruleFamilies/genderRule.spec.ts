import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateTaggedBranches } from "@test/factories/skillTree";
import { filterBranchesByGender } from "./genderRule";

describe("genderRule: filterBranchesByGender", () => {
  it("keeps the branches of the athlete's gender and the untagged ones", () => {
    const branches = generateTaggedBranches(
      { "1": ["GENDER_MALE"], "2": ["GENDER_FEMALE"], "3": [] },
      {},
    );

    const result = filterBranchesByGender(
      branches,
      generateRuleFamilyInput({ gender: "MALE" }).athlete,
    );

    expect(Object.keys(result.keep)).toEqual(["1", "3"]);
    expect(result.removals).toEqual([
      { branchId: "2", family: "gender", details: ["MALE"] },
    ]);
    expect(result.replace).toEqual([]);
  });

  it("keeps the branches of a female athlete and the untagged ones", () => {
    const branches = generateTaggedBranches(
      { "1": ["GENDER_MALE"], "2": ["GENDER_FEMALE"], "3": [] },
      {},
    );

    const result = filterBranchesByGender(
      branches,
      generateRuleFamilyInput({ gender: "FEMALE" }).athlete,
    );

    expect(Object.keys(result.keep)).toEqual(["2", "3"]);
    expect(result.removals).toEqual([
      { branchId: "1", family: "gender", details: ["FEMALE"] },
    ]);
  });

  it("follows the female rules for an athlete without a gender", () => {
    const branches = generateTaggedBranches(
      { "1": ["GENDER_MALE"], "2": ["GENDER_FEMALE"] },
      {},
    );
    const athleteWithoutGender = generateRuleFamilyInput({
      withoutPersonalData: true,
    }).athlete;

    const result = filterBranchesByGender(branches, athleteWithoutGender);

    expect(Object.keys(result.keep)).toEqual(["2"]);
    expect(result.removals).toEqual([
      { branchId: "1", family: "gender", details: ["FEMALE"] },
    ]);
  });
});
