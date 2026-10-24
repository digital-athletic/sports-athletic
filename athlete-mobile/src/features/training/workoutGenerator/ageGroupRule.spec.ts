import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import { filterBranchesByAgeGroup } from "./ageGroupRule";

describe("ageGroupRule: filterBranchesByAgeGroup", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("keeps the branches of an adult and the untagged ones", () => {
    const branches = {
      "1": { tags: ["AGE_ADULT"], levels: {} },
      "2": { tags: ["AGE_CHILD"], levels: {} },
      "3": { tags: [], levels: {} },
    };

    const result = filterBranchesByAgeGroup(
      branches,
      generateRuleFamilyInput({ birthday: "1990-06-15" }),
    );

    expect(Object.keys(result.keep)).toEqual(["1", "3"]);
    expect(result.removals).toEqual([
      { branchId: "2", family: "ageGroup", details: ["ADULT"] },
    ]);
    expect(result.replace).toEqual([]);
  });

  it("keeps the branches of a child and the untagged ones", () => {
    const branches = {
      "1": { tags: ["AGE_ADULT"], levels: {} },
      "2": { tags: ["AGE_CHILD"], levels: {} },
      "3": { tags: [], levels: {} },
    };

    const result = filterBranchesByAgeGroup(
      branches,
      generateRuleFamilyInput({ birthday: "2016-01-01" }),
    );

    expect(Object.keys(result.keep)).toEqual(["2", "3"]);
    expect(result.removals).toEqual([
      { branchId: "1", family: "ageGroup", details: ["CHILD"] },
    ]);
  });

  it("follows the adult rules for an adolescent and names the age group", () => {
    const branches = {
      "1": { tags: ["AGE_ADULT"], levels: {} },
      "2": { tags: ["AGE_CHILD"], levels: {} },
    };

    const result = filterBranchesByAgeGroup(
      branches,
      generateRuleFamilyInput({ birthday: "2009-01-01" }),
    );

    expect(Object.keys(result.keep)).toEqual(["1"]);
    expect(result.removals).toEqual([
      { branchId: "2", family: "ageGroup", details: ["ADOLESCENT"] },
    ]);
  });

  it("follows the adult rules for an athlete without a birthday", () => {
    const branches = {
      "1": { tags: ["AGE_ADULT"], levels: {} },
      "2": { tags: ["AGE_CHILD"], levels: {} },
    };

    const result = filterBranchesByAgeGroup(
      branches,
      generateRuleFamilyInput({ birthday: "" }),
    );

    expect(Object.keys(result.keep)).toEqual(["1"]);
    expect(result.removals).toEqual([
      { branchId: "2", family: "ageGroup", details: ["ADULT"] },
    ]);
  });

  it("keeps a branch tagged for both age groups", () => {
    const branches = { "4": { tags: ["AGE_ADULT", "AGE_CHILD"], levels: {} } };

    const result = filterBranchesByAgeGroup(
      branches,
      generateRuleFamilyInput({ birthday: "2016-01-01" }),
    );

    expect(result.keep).toEqual(branches);
    expect(result.removals).toEqual([]);
  });
});
