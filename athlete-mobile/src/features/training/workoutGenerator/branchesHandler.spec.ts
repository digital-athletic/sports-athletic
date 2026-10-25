import { loadExercises } from "@/data/loadExercises";
import { generateGenerationInput } from "../../../../test/factories/generationInput";
import { generateStoredDayEntry } from "../../../../test/factories/storedBranch";
import { generateBranchesBlock } from "../../../../test/factories/templateBlock";
import { createBranchesBlockHandler } from "./branchesHandler";
import {
  createStoredDayBranchLookup,
  lookUpStoredBranchInCatalog,
} from "./storedBranchLookup";
import { setUpWorkout } from "./workoutSetup";

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
      generateGenerationInput({
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

  // sore CHEST blocks every upper body branch of GKS, so 510 finds no replacement
  it("keeps the kept branches when no replacement fits the requested region", () => {
    const input = setUpWorkout(
      generateGenerationInput({
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

  // without weights GKS replaces from GKSKG; no upper body branch fits, so a less used region refills
  it("refills the requested regions from the skill tree the place selects", () => {
    const input = setUpWorkout(
      generateGenerationInput({
        soreMuscles: ["CHEST"],
        exerciseCatalog,
        random: () => 0,
      }),
    );

    const result = handleBlock(
      generateBranchesBlock("GKS", ["510", "523"]),
      input,
      NO_BRANCHES,
    );

    expect(result).toMatchObject({
      status: "filled",
      usedBranchIds: ["939", "547"],
    });
  });

  it("replaces every slot of a prevention skill, its kept branches included", () => {
    const input = setUpWorkout(
      generateGenerationInput({
        soreMuscles: ["QUADRICEPS"],
        pains: ["KNEE_LEFT", "SHOULDER_LEFT"],
        exerciseCatalog,
        random: () => 0,
      }),
    );

    // the first eight branches of the PREVKG tree
    const result = handleBlock(
      generateBranchesBlock("PREVSHOULDER", [
        "102",
        "103",
        "104",
        "146",
        "147",
        "148",
        "149",
        "150",
      ]),
      input,
      NO_BRANCHES,
    );

    expect(result).toMatchObject({
      status: "filled",
      usedBranchIds: ["152", "148", "619", "158", "163", "624", "620", "633"],
    });
  });

  // an emptied prevention or special warm-up skill records no error
  it("ends empty without a reason when a prevention skill finds no replacement", () => {
    const input = setUpWorkout(
      generateGenerationInput({
        soreMuscles: ["QUADRICEPS"],
        pains: ["KNEE_LEFT", "SHOULDER_LEFT"],
        exerciseCatalog,
        random: () => 0,
      }),
    );
    // the first eight branches of the PREVKG tree
    const block = generateBranchesBlock("PREVKNEE", [
      "102",
      "103",
      "104",
      "146",
      "147",
      "148",
      "149",
      "150",
    ]);

    expect(handleBlock(block, input, NO_BRANCHES)).toEqual({
      status: "empty",
      block,
      reason: undefined,
      usedBranchIds: [],
    });
  });

  it.each([
    [
      "the replacement finds no skill tree",
      "SASKG",
      ["510", "523"],
      ["BARBELL"],
    ],
    ["no stored ID resolves", "GKS", ["999999"], []],
  ])(
    "ends empty with the equipment reason when %s",
    (_, skill, ids, params) => {
      const input = setUpWorkout(
        generateGenerationInput({ soreMuscles: ["CHEST"], exerciseCatalog }),
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
          generateStoredDayEntry("510", ["REGION_UPPER_BODY"], "336"),
          generateStoredDayEntry("900001", ["REGION_CORE"], "16"),
        ],
      }),
    );
    const input = setUpWorkout(generateGenerationInput({ exerciseCatalog }));

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
          // level 3 only, which the athlete level does not reach
          {
            ...generateStoredDayEntry("1"),
            exercises: { "3": { exerciseId: "16" } },
          },
          generateStoredDayEntry("2", [], "20"),
        ],
      }),
    );
    const input = setUpWorkout(generateGenerationInput({ exerciseCatalog }));

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
