import { loadExercises } from "@/data/loadExercises";
import type { ExerciseBranchEntry } from "@/schemas/generator.schema";
import {
  generateRuleFamilyInput,
  generateSkillTreeBranches,
} from "../../../../test/factories/ruleFamilyInput";
import { filterBranchesByFitnessLevel } from "./fitnessLevelRule";
import { createGenerationInput } from "./generationInput";

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
    const { tags, levels } = generateSkillTreeBranches("GKS", ["523"])["523"];
    const storedEntry: ExerciseBranchEntry = {
      branchId: "523",
      tags,
      exercises: Object.fromEntries(Object.entries(levels)),
    };

    const result = filterBranchesByFitnessLevel({ "523": storedEntry }, input);

    expect(result.keep).toEqual({});
  });

  it("keeps a branch at the level of the athlete's branch progress", () => {
    const branches = generateSkillTreeBranches("GKS", ["523"]);
    const progressLevel = Number(Object.keys(branches["523"].levels)[0]);
    const input = {
      ...generateRuleFamilyInput({
        level: "BEGINNER",
        exerciseCatalog: loadExercises(),
      }),
      exerciseData: {
        exerciseData: {},
        branchData: { "523": { branchId: "523", level: progressLevel } },
      },
    };

    const result = filterBranchesByFitnessLevel(branches, input);

    expect(result.keep).toEqual(branches);
    expect(result.removals).toEqual([]);
  });

  it("keeps every branch for an athlete without workout data", () => {
    const input = createGenerationInput({
      athlete: { userId: "athlete" },
      place: "STUDIO",
      equipment: [],
      exerciseCatalog: [],
      exerciseData: { exerciseData: {}, branchData: {} },
    });
    const branches = generateSkillTreeBranches("GKS", ["523"]);

    expect(filterBranchesByFitnessLevel(branches, input).keep).toBe(branches);
  });
});
