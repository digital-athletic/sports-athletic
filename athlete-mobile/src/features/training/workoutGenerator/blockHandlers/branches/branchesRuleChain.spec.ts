import { loadExercises } from "@/data/loadExercises";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateStoredBranches } from "@test/factories/storedBranch";
import { resolveWorkoutFilters } from "../../workoutFilters";
import { applyBranchesRuleChain } from "./branchesRuleChain";

const exerciseCatalog = loadExercises();

/**
 * Builds a stored GKS branch with its real levels and the given tags instead
 * of its own.
 *
 * generateGksBranchWithTags("510", ["REGION_CORE", "GENDER_MALE"])
 * → { branchId: "510", branch: { tags: ["REGION_CORE", "GENDER_MALE"], levels: {...} } }
 */
const generateGksBranchWithTags = (branchId: string, tags: string[]) => {
  const [stored] = generateStoredBranches("GKS", [branchId]);
  return { ...stored, branch: { ...stored.branch, tags } };
};

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
      resolveWorkoutFilters(),
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
      resolveWorkoutFilters(),
    );

    expect(Object.keys(result.keep)).toEqual(["510", "547"]);
  });

  it("keys the candidates by branch ID in ascending order", () => {
    const input = generateRuleFamilyInput({
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      generateStoredBranches("GKS", ["523", "510", "523"]),
      input,
      "GKS",
      resolveWorkoutFilters(),
    );

    expect(Object.keys(result.keep)).toEqual(["510", "523"]);
  });

  it("runs soreness before equipment", () => {
    const input = generateRuleFamilyInput({ soreMuscles: ["CHEST"] });

    const result = applyBranchesRuleChain(
      generateStoredBranches("GKS", ["510", "523"]),
      input,
      "GKS",
      resolveWorkoutFilters(),
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
      resolveWorkoutFilters(),
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
      resolveWorkoutFilters(),
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
      resolveWorkoutFilters(),
    );

    expect(result.keep).toEqual({});
    expect(result.emptyReason).toEqual({
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
      params: [],
    });
  });

  it("removes the stored branch that blocks a painful region and requests a replacement", () => {
    const input = generateRuleFamilyInput({
      pains: ["KNEE_LEFT"],
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      [
        generateGksBranchWithTags("510", ["REGION_LOWER_BODY", "BLOCK_KNEE"]),
        generateGksBranchWithTags("523", ["REGION_LOWER_BODY"]),
      ],
      input,
      "GKS",
      resolveWorkoutFilters(),
    );

    expect(Object.keys(result.keep)).toEqual(["523"]);
    expect(
      result.removals.map(({ branchId, family }) => [branchId, family]),
    ).toEqual([["510", "pain"]]);
    expect(result.replace).toEqual(["LOWER_BODY"]);
  });

  it("removes the stored branch of the other age group and requests a replacement", () => {
    const input = generateRuleFamilyInput({
      birthday: "2016-06-15",
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      [
        generateGksBranchWithTags("510", ["REGION_CORE", "AGE_ADULT"]),
        generateGksBranchWithTags("523", ["REGION_CORE", "AGE_CHILD"]),
      ],
      input,
      "GKS",
      resolveWorkoutFilters(),
    );

    expect(Object.keys(result.keep)).toEqual(["523"]);
    expect(
      result.removals.map(({ branchId, family }) => [branchId, family]),
    ).toEqual([["510", "ageGroup"]]);
    expect(result.replace).toEqual(["CORE"]);
  });

  it("removes the stored branch of the other gender and requests a replacement", () => {
    const input = generateRuleFamilyInput({
      gender: "FEMALE",
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      [
        generateGksBranchWithTags("510", ["REGION_UPPER_BODY", "GENDER_MALE"]),
        generateGksBranchWithTags("523", [
          "REGION_UPPER_BODY",
          "GENDER_FEMALE",
        ]),
      ],
      input,
      "GKS",
      resolveWorkoutFilters(),
    );

    expect(Object.keys(result.keep)).toEqual(["523"]);
    expect(
      result.removals.map(({ branchId, family }) => [branchId, family]),
    ).toEqual([["510", "gender"]]);
    expect(result.replace).toEqual(["UPPER_BODY"]);
  });

  it("keeps the branch of a sore region when the soreness filter is off", () => {
    const input = generateRuleFamilyInput({
      soreMuscles: ["CHEST"],
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      generateStoredBranches("GKS", ["510", "523"]),
      input,
      "GKS",
      resolveWorkoutFilters({ soreness: false }),
    );

    expect(Object.keys(result.keep)).toEqual(["510", "523"]);
    expect(result.replace).toEqual([]);
  });

  it("throws no soreness error for two sore areas when the soreness filter is off", () => {
    const input = generateRuleFamilyInput({
      soreMuscles: ["CHEST", "QUADRICEPS"],
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    expect(() =>
      applyBranchesRuleChain(
        generateStoredBranches("GKS", ["510"]),
        input,
        "GKS",
        resolveWorkoutFilters({ soreness: false }),
      ),
    ).not.toThrow();
  });

  it("keeps the branch that needs missing equipment when the equipment filter is off", () => {
    const input = generateRuleFamilyInput({ equipment: [], exerciseCatalog });

    const result = applyBranchesRuleChain(
      generateStoredBranches("GKS", ["510", "523"]),
      input,
      "GKS",
      resolveWorkoutFilters({ equipment: false }),
    );

    expect(Object.keys(result.keep)).toEqual(["510", "523"]);
    expect(result.removals).toEqual([]);
  });

  it("keeps the branch that blocks a painful region when the pain filter is off", () => {
    const input = generateRuleFamilyInput({
      pains: ["KNEE_LEFT"],
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      [
        generateGksBranchWithTags("510", ["REGION_LOWER_BODY", "BLOCK_KNEE"]),
        generateGksBranchWithTags("523", ["REGION_LOWER_BODY"]),
      ],
      input,
      "GKS",
      resolveWorkoutFilters({ pain: false }),
    );

    expect(Object.keys(result.keep)).toEqual(["510", "523"]);
    expect(result.replace).toEqual([]);
  });

  it("removes the branch of the other age group when the pain filter is off", () => {
    const input = generateRuleFamilyInput({
      birthday: "2016-06-15",
      pains: ["KNEE_LEFT"],
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      [
        generateGksBranchWithTags("510", [
          "REGION_CORE",
          "BLOCK_KNEE",
          "AGE_ADULT",
        ]),
        generateGksBranchWithTags("523", ["REGION_CORE", "BLOCK_KNEE"]),
      ],
      input,
      "GKS",
      resolveWorkoutFilters({ pain: false }),
    );

    expect(Object.keys(result.keep)).toEqual(["523"]);
    expect(
      result.removals.map(({ branchId, family }) => [branchId, family]),
    ).toEqual([["510", "ageGroup"]]);
  });

  it("removes the branch of the other gender when the pain filter is off", () => {
    const input = generateRuleFamilyInput({
      gender: "FEMALE",
      pains: ["KNEE_LEFT"],
      equipment: ["DUMBBELL", "BARBELL"],
      exerciseCatalog,
    });

    const result = applyBranchesRuleChain(
      [
        generateGksBranchWithTags("510", [
          "REGION_UPPER_BODY",
          "BLOCK_KNEE",
          "GENDER_MALE",
        ]),
        generateGksBranchWithTags("523", ["REGION_UPPER_BODY", "BLOCK_KNEE"]),
      ],
      input,
      "GKS",
      resolveWorkoutFilters({ pain: false }),
    );

    expect(Object.keys(result.keep)).toEqual(["523"]);
    expect(
      result.removals.map(({ branchId, family }) => [branchId, family]),
    ).toEqual([["510", "gender"]]);
  });
});
