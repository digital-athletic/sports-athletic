import {
  generateExercisesBlock,
  generatePrescribedReferences,
} from "@test/factories/exercisesBlock";
import { generateFilledBlockResult } from "@test/factories/blockResult";
import { generateBranchesBlock } from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import { generateTaggedExercise } from "@test/factories/valueExercise";
import {
  generateWorkoutInput,
  type WorkoutInputFactoryOptions,
} from "@test/factories/workoutInput";
import { createExercisesBlockHandler } from "./exercisesHandler";

const BLOCK_PATH = "TESTDAY.blocks[1]";

const { handleBlock: handleExercisesBlock } = createExercisesBlockHandler({
  equipment: "required",
});

// Catalog of two lifts: "25" needs a barbell and a power rack, "50" a barbell bench.
const generateLiftCatalog = () => [
  generateTaggedExercise("25", ["EQ_BARBELL", "EQ_POWER_RACK"]),
  generateTaggedExercise("50", ["EQ_BARBELL_BENCH"]),
  generateTaggedExercise("342", []),
];

describe("exercisesHandler: handleExercisesBlock", () => {
  it("returns a prescribed result with the exercises in list order and no used branches", () => {
    const block = generateExercisesBlock(["342", "25", "50"]);
    const input = generateWorkoutInput({
      equipment: ["BARBELL", "POWER_RACK", "BARBELL_BENCH"],
      exerciseCatalog: generateLiftCatalog(),
    });

    const result = handleExercisesBlock(block, input, new Set(), {
      earlierResults: [],
      blockPath: BLOCK_PATH,
    });

    expect(result).toEqual({
      status: "prescribed",
      block,
      exercises: [
        { source: "exercise", exerciseId: "342" },
        { source: "exercise", exerciseId: "25" },
        { source: "exercise", exerciseId: "50" },
      ],
      usedBranchIds: [],
    });
  });

  it.each<[string, WorkoutInputFactoryOptions, string[]]>([
    ["a beginner man", { level: "BEGINNER", gender: "MALE" }, []],
    ["a professional woman", { level: "PROFESSIONAL", gender: "FEMALE" }, []],
    [
      "an athlete with stored branch levels",
      { branchLevels: { "510": 3, "523": 2 } },
      [],
    ],
    ["used branches passed in", {}, ["510", "523"]],
  ])("keeps the order and the IDs for %s", (_label, options, usedBranchIds) => {
    const block = generateExercisesBlock(["50", "25"]);
    const input = generateWorkoutInput({
      equipment: ["BARBELL", "POWER_RACK", "BARBELL_BENCH"],
      exerciseCatalog: generateLiftCatalog(),
      ...options,
    });

    const result = handleExercisesBlock(block, input, new Set(usedBranchIds), {
      earlierResults: [],
      blockPath: BLOCK_PATH,
    });

    expect(result).toMatchObject({
      status: "prescribed",
      exercises: generatePrescribedReferences(["50", "25"]),
      usedBranchIds: [],
    });
  });

  it("throws a template error naming the block path for an ID missing from the catalog", () => {
    const block = generateExercisesBlock(["342", "999"]);
    const input = generateWorkoutInput({
      exerciseCatalog: generateLiftCatalog(),
    });

    expect(() =>
      handleExercisesBlock(block, input, new Set(), {
        earlierResults: [],
        blockPath: BLOCK_PATH,
      }),
    ).toThrow(`${BLOCK_PATH}: exercise 999 is no catalog exercise`);
  });

  it("throws NO_EXERCISES EQUIPMENT with the missing equipment parts", () => {
    const block = generateExercisesBlock(["25"]);
    const input = generateWorkoutInput({
      equipment: ["BARBELL"],
      exerciseCatalog: generateLiftCatalog(),
    });

    const thrown = catchThrownValue(() =>
      handleExercisesBlock(block, input, new Set(), {
        earlierResults: [],
        blockPath: BLOCK_PATH,
      }),
    );

    expect(thrown).toEqual({
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
      params: ["POWER_RACK"],
    });
  });

  it("counts BARBELL_MULTIPLE as a barbell", () => {
    const block = generateExercisesBlock(["342"]);
    const input = generateWorkoutInput({
      equipment: ["BARBELL_MULTIPLE"],
      exerciseCatalog: [generateTaggedExercise("342", ["EQ_BARBELL"])],
    });

    const result = handleExercisesBlock(block, input, new Set(), {
      earlierResults: [],
      blockPath: BLOCK_PATH,
    });

    expect(result.status).toBe("prescribed");
  });

  it("lets any item containing BENCH serve BARBELL_BENCH", () => {
    const block = generateExercisesBlock(["50"]);
    const input = generateWorkoutInput({
      equipment: ["PARK_BENCH"],
      exerciseCatalog: generateLiftCatalog(),
    });

    const result = handleExercisesBlock(block, input, new Set(), {
      earlierResults: [],
      blockPath: BLOCK_PATH,
    });

    expect(result.status).toBe("prescribed");
  });

  it("throws a template error naming the block path for an ID listed twice", () => {
    const block = generateExercisesBlock(["342", "50", "342"]);
    const input = generateWorkoutInput({
      equipment: ["BARBELL_BENCH"],
      exerciseCatalog: generateLiftCatalog(),
    });

    expect(() =>
      handleExercisesBlock(block, input, new Set(), {
        earlierResults: [],
        blockPath: BLOCK_PATH,
      }),
    ).toThrow(`${BLOCK_PATH}: exercise 342 is listed twice`);
  });

  it("throws for an unusable last exercise although the earlier ones are fine", () => {
    const block = generateExercisesBlock(["342", "50", "25"]);
    const input = generateWorkoutInput({
      equipment: ["PARK_BENCH"],
      exerciseCatalog: generateLiftCatalog(),
    });

    const thrown = catchThrownValue(() =>
      handleExercisesBlock(block, input, new Set(), {
        earlierResults: [],
        blockPath: BLOCK_PATH,
      }),
    );

    expect(thrown).toEqual({
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
      params: ["BARBELL", "POWER_RACK"],
    });
  });

  it("keeps an exercise that an earlier block trained in the prescribed list", () => {
    const block = generateExercisesBlock(["342", "50"]);
    const input = generateWorkoutInput({
      equipment: ["BARBELL_BENCH"],
      exerciseCatalog: generateLiftCatalog(),
    });
    const earlierResults = [
      generateFilledBlockResult(
        generateBranchesBlock("GKS", ["510"]),
        ["510"],
        () => "342",
      ),
    ];

    const result = handleExercisesBlock(block, input, new Set(["510"]), {
      earlierResults,
      blockPath: BLOCK_PATH,
    });

    expect(result).toMatchObject({
      status: "prescribed",
      exercises: generatePrescribedReferences(["342", "50"]),
    });
  });

  it("prescribes an exercise the place cannot equip under the ignored equipment rule", () => {
    const block = generateExercisesBlock(["25"]);
    const input = generateWorkoutInput({
      equipment: [],
      exerciseCatalog: generateLiftCatalog(),
    });

    const result = createExercisesBlockHandler({
      equipment: "ignored",
    }).handleBlock(block, input, new Set(), {
      earlierResults: [],
      blockPath: BLOCK_PATH,
    });

    expect(result).toMatchObject({
      status: "prescribed",
      exercises: generatePrescribedReferences(["25"]),
    });
  });

  it("shares the used branches across the whole workout", () => {
    expect(
      createExercisesBlockHandler({ equipment: "required" }).usedBranchScope,
    ).toBe("workout");
  });
});
