import { generateTaggedBranches } from "@test/factories/skillTree";
import { filterBranchesByAgeGroup } from "./ageGroupRule";

describe("ageGroupRule: filterBranchesByAgeGroup", () => {
  it("keeps the branches of an adult and the untagged ones", () => {
    const branches = generateTaggedBranches(
      { "1": ["AGE_ADULT"], "2": ["AGE_CHILD"], "3": [] },
      {},
    );

    const result = filterBranchesByAgeGroup(branches, "ADULT");

    expect(Object.keys(result.keep)).toEqual(["1", "3"]);
    expect(result.removals).toEqual([
      { branchId: "2", family: "ageGroup", details: ["ADULT"] },
    ]);
    expect(result.replace).toEqual([]);
  });

  it("keeps the branches of a child and the untagged ones", () => {
    const branches = generateTaggedBranches(
      { "1": ["AGE_ADULT"], "2": ["AGE_CHILD"], "3": [] },
      {},
    );

    const result = filterBranchesByAgeGroup(branches, "CHILD");

    expect(Object.keys(result.keep)).toEqual(["2", "3"]);
    expect(result.removals).toEqual([
      { branchId: "1", family: "ageGroup", details: ["CHILD"] },
    ]);
  });

  it("follows the adult rules for an adolescent and names the age group", () => {
    const branches = generateTaggedBranches(
      { "1": ["AGE_ADULT"], "2": ["AGE_CHILD"] },
      {},
    );

    const result = filterBranchesByAgeGroup(branches, "ADOLESCENT");

    expect(Object.keys(result.keep)).toEqual(["1"]);
    expect(result.removals).toEqual([
      { branchId: "2", family: "ageGroup", details: ["ADOLESCENT"] },
    ]);
  });

  it("keeps a branch tagged for both age groups", () => {
    const branches = generateTaggedBranches(
      { "4": ["AGE_ADULT", "AGE_CHILD"] },
      {},
    );

    const result = filterBranchesByAgeGroup(branches, "CHILD");

    expect(result.keep).toEqual(branches);
    expect(result.removals).toEqual([]);
  });
});
