import { loadExercises } from "@/data/loadExercises";
import type { ExerciseType } from "@/schemas/exercise.schema";
import {
  generateRuleFamilyInput,
  generateSkillTreeBranches,
} from "@test/factories/ruleFamilyInput";
import {
  filterBranchesByPain,
  filterBranchesByPainOnEveryLevel,
} from "./painRule";

/**
 * Copies the first real catalog exercise with the given ID and tags.
 *
 * generateCatalogExercise("900", ["BLOCK_KNEE"])
 * → { ...first catalog exercise, id: "900", tags: ["BLOCK_KNEE"] }
 */
const generateCatalogExercise = (id: string, tags: string[]): ExerciseType => ({
  ...loadExercises()[0],
  id,
  tags,
});

describe("painRule: filterBranchesByPain", () => {
  it("removes a branch whose block tags name a region the pains block", () => {
    const input = generateRuleFamilyInput({ pains: ["KNEE_LEFT"] });
    const branches = generateSkillTreeBranches("GKS", ["510", "523"]);

    const result = filterBranchesByPain(branches, input);

    expect(Object.keys(result.keep)).toEqual(["510"]);
    expect(result.removals).toEqual([
      { branchId: "523", family: "pain", details: ["KNEE"] },
    ]);
    expect(result.replace).toEqual([]);
  });

  it("names the first blocked region in pain order for each removal", () => {
    const input = generateRuleFamilyInput({ pains: ["SPINE", "KNEE_RIGHT"] });
    const branches = {
      "1": { tags: ["BLOCK_KNEE", "BLOCK_SPINE"], levels: {} },
      "2": { tags: ["BLOCK_KNEE"], levels: {} },
    };

    const result = filterBranchesByPain(branches, input);

    expect(result.keep).toEqual({});
    expect(result.removals.map((removal) => removal.details)).toEqual([
      ["SPINE"],
      ["KNEE"],
    ]);
  });

  it("keeps every branch for an athlete without pains", () => {
    const branches = generateSkillTreeBranches("GKS", ["510", "523"]);

    const result = filterBranchesByPain(branches, generateRuleFamilyInput());

    expect(result.keep).toEqual(branches);
    expect(result.removals).toEqual([]);
  });

  it("reads the branch tags only, not the tags of its level exercises", () => {
    const input = generateRuleFamilyInput({
      pains: ["KNEE_LEFT"],
      exerciseCatalog: [generateCatalogExercise("901", ["BLOCK_KNEE"])],
    });
    const branches = {
      "1": { tags: [], levels: { 1: { exerciseId: "901" } } },
    };

    expect(filterBranchesByPain(branches, input).keep).toEqual(branches);
  });
});

describe("painRule: filterBranchesByPainOnEveryLevel", () => {
  it("removes a branch when an exercise on any level blocks a pain region", () => {
    const input = generateRuleFamilyInput({
      pains: ["KNEE_LEFT"],
      exerciseCatalog: [
        generateCatalogExercise("900", []),
        generateCatalogExercise("901", ["BLOCK_KNEE"]),
      ],
    });
    const branches = {
      "1": { tags: [], levels: { 1: { exerciseId: "900" } } },
      "2": {
        tags: [],
        levels: { 1: { exerciseId: "900" }, 2: { exerciseId: "901" } },
      },
      "3": { tags: ["BLOCK_KNEE"], levels: { 1: { exerciseId: "900" } } },
    };

    const result = filterBranchesByPainOnEveryLevel(branches, input);

    expect(Object.keys(result.keep)).toEqual(["1"]);
    expect(result.removals).toEqual([
      { branchId: "2", family: "pain", details: ["KNEE"] },
      { branchId: "3", family: "pain", details: ["KNEE"] },
    ]);
    expect(result.replace).toEqual([]);
  });

  it("reads the levels of a stored branch from its exercises", () => {
    const input = generateRuleFamilyInput({
      pains: ["KNEE_LEFT"],
      exerciseCatalog: [generateCatalogExercise("901", ["BLOCK_KNEE"])],
    });
    const branches = {
      "2": { tags: [], exercises: { 1: { exerciseId: "901" } } },
    };

    expect(filterBranchesByPainOnEveryLevel(branches, input).keep).toEqual({});
  });

  it("reads a level without an exercise ID as a level without block tags", () => {
    const input = generateRuleFamilyInput({
      pains: ["KNEE_LEFT"],
      exerciseCatalog: [generateCatalogExercise("901", ["BLOCK_KNEE"])],
    });
    const branches = {
      "1": { tags: [], levels: { 1: {} } },
      "2": { tags: [], levels: { 1: {}, 2: { exerciseId: "901" } } },
    };

    const result = filterBranchesByPainOnEveryLevel(branches, input);

    expect(Object.keys(result.keep)).toEqual(["1"]);
  });

  it("keeps a branch whose level exercise is missing from the catalog", () => {
    const input = generateRuleFamilyInput({ pains: ["KNEE_LEFT"] });
    const branches = {
      "1": { tags: [], levels: { 1: { exerciseId: "999" } } },
    };

    expect(filterBranchesByPainOnEveryLevel(branches, input).keep).toEqual(
      branches,
    );
  });

  it("names only the regions that block the removed branch", () => {
    const input = generateRuleFamilyInput({
      pains: ["KNEE_LEFT", "SPINE"],
      exerciseCatalog: [generateCatalogExercise("901", ["BLOCK_KNEE"])],
    });
    const branches = {
      "1": { tags: [], levels: { 1: { exerciseId: "901" } } },
    };

    const result = filterBranchesByPainOnEveryLevel(branches, input);

    expect(result.removals).toEqual([
      { branchId: "1", family: "pain", details: ["KNEE"] },
    ]);
  });
});
