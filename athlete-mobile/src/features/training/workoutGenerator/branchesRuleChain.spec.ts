import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import { applyBranchesRuleChain } from "./branchesRuleChain";
import type { StoredBranch } from "./storedBranchLookup";

/**
 * Lists catalog branches of one skill tree as a branches block stores them.
 *
 * generateStoredBranches("GKS", ["523", "510"])
 * → [{ branchId: "523", branch: { tags: [...], levels: {...} } }, { branchId: "510", ... }]
 */
const generateStoredBranches = (
  treeName: string,
  branchIds: string[],
): StoredBranch[] =>
  branchIds.map((branchId) => ({
    branchId,
    branch: getAllSkillTrees()[treeName][branchId],
  }));

const exerciseCatalog = loadExercises();

describe("branchesRuleChain: applyBranchesRuleChain", () => {
  it("keeps the branches that pass soreness, equipment and fitness level", () => {
    const input = generateRuleFamilyInput({
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      generateStoredBranches("GKS", ["510", "523"]),
      input,
      "GKS",
    );

    expect(Object.keys(result.keep)).toEqual(["510", "523"]);
    expect(result.removals).toEqual([]);
    expect(result.replace).toEqual([]);
  });

  it("keeps a GKSKG branch of a GKS block at a place with weights", () => {
    const input = generateRuleFamilyInput({
      equipment: ["DUMBBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      [
        ...generateStoredBranches("GKS", ["510"]),
        ...generateStoredBranches("GKSKG", ["547"]),
      ],
      input,
      "GKS",
    );

    expect(Object.keys(result.keep)).toEqual(["510", "547"]);
  });

  it("keys the candidates by branch ID in ascending order, as main's branch record", () => {
    const input = generateRuleFamilyInput({
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      generateStoredBranches("GKS", ["523", "510", "523"]),
      input,
      "GKS",
    );

    expect(Object.keys(result.keep)).toEqual(["510", "523"]);
  });

  it("runs soreness before equipment", () => {
    const input = generateRuleFamilyInput({ soreMuscles: ["CHEST"] });

    const result = applyBranchesRuleChain(
      generateStoredBranches("GKS", ["510", "523"]),
      input,
      "GKS",
    );

    expect(result.replace).toEqual(["UPPER_BODY", "FULL_BODY"]);
    expect(
      result.removals.map(({ branchId, family }) => [branchId, family]),
    ).toEqual([
      ["510", "muscleSoreness"],
      ["523", "equipment"],
    ]);
  });

  it("runs equipment before fitness level", () => {
    const input = generateRuleFamilyInput({
      level: "BEGINNER",
      equipment: ["BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      generateStoredBranches("GKS", ["523", "510"]),
      input,
      "GKS",
    );

    expect(result.replace).toEqual(["UPPER_BODY", "FULL_BODY"]);
    expect(
      result.removals.map(({ branchId, family }) => [branchId, family]),
    ).toEqual([
      ["510", "equipment"],
      ["523", "fitnessLevel"],
    ]);
  });

  it("names the equipment the branches soreness kept miss in the empty reason", () => {
    const input = generateRuleFamilyInput({ soreMuscles: ["CHEST"] });

    const result = applyBranchesRuleChain(
      generateStoredBranches("GKS", ["510", "523"]),
      input,
      "GKS",
    );

    expect(result.emptyReason).toEqual({
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
      params: ["BARBELL"],
    });
  });

  it("returns the empty reason instead of throwing when nothing is left", () => {
    const input = generateRuleFamilyInput({ soreMuscles: ["CHEST"] });

    const result = applyBranchesRuleChain(
      generateStoredBranches("SWR1KG", ["79", "81"]),
      input,
      "SWR2KG",
    );

    expect(result.keep).toEqual({});
    expect(result.emptyReason).toEqual({
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
      params: [],
    });
  });

  it("applies no pain, age group or gender family to stored branches", () => {
    const input = generateRuleFamilyInput({
      birthday: "2016-06-15",
      gender: "FEMALE",
      pains: ["KNEE_LEFT"],
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      generateStoredBranches("GKS", ["510", "523"]),
      input,
      "GKS",
    );

    expect(Object.keys(result.keep)).toEqual(["510", "523"]);
  });
});
