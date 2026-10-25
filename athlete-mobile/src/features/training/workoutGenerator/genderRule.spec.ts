import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { filterBranchesByGender } from "./genderRule";

describe("genderRule: filterBranchesByGender", () => {
  it("keeps the branches of the athlete's gender and the untagged ones", () => {
    const branches = {
      "1": { tags: ["GENDER_MALE"], levels: {} },
      "2": { tags: ["GENDER_FEMALE"], levels: {} },
      "3": { tags: [], levels: {} },
    };

    const result = filterBranchesByGender(
      branches,
      generateRuleFamilyInput({ gender: "MALE" }),
    );

    expect(Object.keys(result.keep)).toEqual(["1", "3"]);
    expect(result.removals).toEqual([
      { branchId: "2", family: "gender", details: ["MALE"] },
    ]);
    expect(result.replace).toEqual([]);
  });

  it("keeps the branches of a female athlete and the untagged ones", () => {
    const branches = {
      "1": { tags: ["GENDER_MALE"], levels: {} },
      "2": { tags: ["GENDER_FEMALE"], levels: {} },
      "3": { tags: [], levels: {} },
    };

    const result = filterBranchesByGender(
      branches,
      generateRuleFamilyInput({ gender: "FEMALE" }),
    );

    expect(Object.keys(result.keep)).toEqual(["2", "3"]);
    expect(result.removals).toEqual([
      { branchId: "1", family: "gender", details: ["FEMALE"] },
    ]);
  });

  it("follows the female rules for an athlete without a gender", () => {
    const branches = {
      "1": { tags: ["GENDER_MALE"], levels: {} },
      "2": { tags: ["GENDER_FEMALE"], levels: {} },
    };
    const input = generateRuleFamilyInput();
    const inputWithoutGender = { ...input, athlete: { userId: "athlete" } };

    const result = filterBranchesByGender(branches, inputWithoutGender);

    expect(Object.keys(result.keep)).toEqual(["2"]);
    expect(result.removals).toEqual([
      { branchId: "1", family: "gender", details: ["FEMALE"] },
    ]);
  });
});
