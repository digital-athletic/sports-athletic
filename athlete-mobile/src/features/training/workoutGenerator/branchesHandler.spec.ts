import { loadExercises } from "@/data/loadExercises";
import type { Block } from "@/schemas/aiwl.schema";
import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import { createBranchesBlockHandler } from "./branchesHandler";
import {
  createStoredDayBranchLookup,
  lookUpStoredBranchInCatalog,
} from "./storedBranchLookup";
import { setUpWorkout } from "./workoutSetup";

type BranchesBlock = Extract<Block, { kind: "branches" }>;

/**
 * Builds a branches block as a training day stores it.
 *
 * generateBranchesBlock("GKS", ["510", "523"])
 * → { kind: "branches", skill: "GKS", branches: ["510", "523"], duration: 600 }
 */
const generateBranchesBlock = (
  skill: string,
  branches: string[],
): BranchesBlock => ({ kind: "branches", skill, branches, duration: 600 });

const exerciseCatalog = loadExercises();
const NO_BRANCHES = new Set<string>();

describe("branchesHandler: createBranchesBlockHandler", () => {
  const { handleBlock, usedBranchScope } = createBranchesBlockHandler(
    lookUpStoredBranchInCatalog,
  );

  // a forgotten lookup would read the catalog instead of a stored snapshot
  it("takes the stored branch lookup without a default", () => {
    expect(createBranchesBlockHandler).toHaveLength(1);
  });

  it("resolves every stored branch in stored order at the athlete level", () => {
    const input = setUpWorkout(
      generateRuleFamilyInput({
        equipment: ["DUMBBELL", "BARBELL"],
        exerciseCatalog,
      }),
    );
    const block = generateBranchesBlock("GKS", ["523", "510", "523"]);

    const result = handleBlock(block, input, NO_BRANCHES);

    expect(result).toMatchObject({
      status: "filled",
      block,
      usedBranchIds: ["523", "510"],
    });
    expect(
      result.status === "filled" &&
        result.exercises.map(({ branchId, exerciseId }) => [
          branchId,
          exerciseId,
        ]),
    ).toEqual([
      ["523", "375"],
      ["510", "20"],
      ["523", "375"],
    ]);
  });

  it("keeps only the kept branches when the rule chain requests a region, until replacement", () => {
    const input = setUpWorkout(
      generateRuleFamilyInput({
        soreMuscles: ["CHEST"],
        equipment: ["BARBELL"],
        exerciseCatalog,
      }),
    );

    const result = handleBlock(
      generateBranchesBlock("GKS", ["523", "510"]),
      input,
      NO_BRANCHES,
    );

    expect(
      result.status === "filled" &&
        result.exercises.map(({ branchId }) => branchId),
    ).toEqual(["523"]);
  });

  it.each([
    ["the rule chain removes every branch", "GKS", ["510", "523"], ["BARBELL"]],
    ["no stored ID resolves", "GKS", ["999999"], []],
  ])(
    "ends empty with the equipment reason when %s",
    (_, skill, ids, params) => {
      const input = setUpWorkout(
        generateRuleFamilyInput({ soreMuscles: ["CHEST"], exerciseCatalog }),
      );
      const block = generateBranchesBlock(skill, ids);

      expect(handleBlock(block, input, NO_BRANCHES)).toEqual({
        status: "empty",
        block,
        reason: { type: "NO_EXERCISES", subtype: "EQUIPMENT", params },
        usedBranchIds: [],
      });
    },
  );

  it("gives every block its own used branches", () => {
    expect(usedBranchScope).toBe("block");
  });
});

describe("branchesHandler: stored day entries", () => {
  it("generates from the stored entries, including an ID no skill tree holds", () => {
    const { handleBlock } = createBranchesBlockHandler(
      createStoredDayBranchLookup({
        GKS: [
          {
            branchId: "510",
            tags: ["REGION_UPPER_BODY"],
            exercises: { "2": { exerciseId: "336" } },
          },
          {
            branchId: "900001",
            tags: ["REGION_CORE"],
            exercises: { "2": { exerciseId: "16" } },
          },
        ],
      }),
    );
    const input = setUpWorkout(generateRuleFamilyInput({ exerciseCatalog }));

    const result = handleBlock(
      generateBranchesBlock("GKS", ["510", "900001"]),
      input,
      NO_BRANCHES,
    );

    expect(
      result.status === "filled" &&
        result.exercises.map(({ branchId, exerciseId }) => [
          branchId,
          exerciseId,
        ]),
    ).toEqual([
      ["510", "336"],
      ["900001", "16"],
    ]);
  });

  it("resolves a branch a family removed without a region to -1 when nothing requests a region", () => {
    const { handleBlock } = createBranchesBlockHandler(
      createStoredDayBranchLookup({
        GKS: [
          { branchId: "1", tags: [], exercises: { "3": { exerciseId: "16" } } },
          { branchId: "2", tags: [], exercises: { "2": { exerciseId: "20" } } },
        ],
      }),
    );
    const input = setUpWorkout(generateRuleFamilyInput({ exerciseCatalog }));

    const result = handleBlock(
      generateBranchesBlock("GKS", ["1", "2"]),
      input,
      NO_BRANCHES,
    );

    expect(
      result.status === "filled" &&
        result.exercises.map(({ branchId, exerciseId }) => [
          branchId,
          exerciseId,
        ]),
    ).toEqual([
      ["1", "-1"],
      ["2", "20"],
    ]);
  });
});
