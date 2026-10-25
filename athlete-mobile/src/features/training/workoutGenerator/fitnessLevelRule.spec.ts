import { loadExercises } from "@/data/loadExercises";
import {
  generateRuleFamilyInput,
  generateSkillTreeBranches,
} from "@test/factories/ruleFamilyInput";
import { generateStoredDayEntry } from "@test/factories/storedBranch";
import { filterBranchesByFitnessLevel } from "./fitnessLevelRule";

describe("fitnessLevelRule: filterBranchesByFitnessLevel", () => {
  it("keeps the branches with an exercise at the athlete's fitness level", () => {
    const input = generateRuleFamilyInput({ exerciseCatalog: loadExercises() });
    const branches = generateSkillTreeBranches("GKS", ["510", "523"]);

    const result = filterBranchesByFitnessLevel(branches, input);

    expect(result.keep).toEqual(branches);
    expect(result.removals).toEqual([]);
    expect(result.replace).toEqual([]);
  });

  it("removes a branch without an exercise at the fitness level", () => {
    const input = generateRuleFamilyInput({
      level: "BEGINNER",
      exerciseCatalog: loadExercises(),
    });
    const branches = generateSkillTreeBranches("GKS", ["523"]);

    const result = filterBranchesByFitnessLevel(branches, input);

    expect(result.keep).toEqual({});
    expect(result.removals).toEqual([
      { branchId: "523", family: "fitnessLevel", details: ["BEGINNER"] },
    ]);
    expect(result.replace).toEqual(["FULL_BODY"]);
  });

  it("reads the levels of a stored branch from its exercises", () => {
    const input = generateRuleFamilyInput({
      level: "BEGINNER",
      exerciseCatalog: loadExercises(),
    });
    // a BEGINNER reaches level 1, which only the stored exercises author
    const storedEntry = generateStoredDayEntry(
      "523",
      ["REGION_FULL_BODY"],
      "375",
      { exercises: { 1: { exerciseId: "375" } }, levels: {} },
    );

    const result = filterBranchesByFitnessLevel({ "523": storedEntry }, input);

    expect(result.keep).toEqual({ "523": storedEntry });
    expect(result.removals).toEqual([]);
  });

  it("keeps a branch at the athlete's branch level", () => {
    // GKS 523 authors levels 2 and 3, above the BEGINNER entry level 1
    const branches = generateSkillTreeBranches("GKS", ["523"]);
    const input = generateRuleFamilyInput({
      level: "BEGINNER",
      exerciseCatalog: loadExercises(),
      branchLevels: { "523": 2 },
    });

    const result = filterBranchesByFitnessLevel(branches, input);

    expect(result.keep).toEqual(branches);
    expect(result.removals).toEqual([]);
  });

  it("keeps every branch for an athlete without workout data", () => {
    const input = generateRuleFamilyInput({ withoutWorkoutData: true });
    const branches = generateSkillTreeBranches("GKS", ["523"]);

    expect(filterBranchesByFitnessLevel(branches, input).keep).toBe(branches);
  });
});
