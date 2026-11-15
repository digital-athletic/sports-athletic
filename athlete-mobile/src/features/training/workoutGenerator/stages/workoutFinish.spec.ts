import {
  generateEmptyBranchesResult,
  generateFilledBranchesResult,
} from "@test/factories/blockResult";
import { generateEquipmentError } from "@test/factories/generatorError";
import { generatePrescribedResult } from "@test/factories/strengthTestResult";
import { catchThrownValue } from "@test/factories/thrownValue";
import { type BuiltBlockResult, finishWorkout } from "./workoutFinish";

/**
 * Stub set list builder: one entry per exercise, dropping the exercise ID
 * "-1" of a branch without a catalog exercise, as the old builder does.
 *
 * buildStubSetList([GKS with exercises "10" and "-1"]) → ["GKS 10"]
 */
const buildStubSetList = (blocks: BuiltBlockResult[]): string[] =>
  blocks.flatMap((result) =>
    result.exercises
      .filter((exercise) => exercise.exerciseId !== "-1")
      .map((exercise) => `${result.block.skill} ${exercise.exerciseId}`),
  );

describe("workoutFinish: finishWorkout", () => {
  it("builds filled blocks that stand out of section order in template order", () => {
    const results = [
      generateFilledBranchesResult("SWR2KG"),
      generateFilledBranchesResult("CD"),
      generateFilledBranchesResult("CARDIO_5"),
      generateFilledBranchesResult("GKS"),
      generateFilledBranchesResult("BR"),
    ];

    const workout = finishWorkout(
      results,
      { requiredBlocks: "none" },
      buildStubSetList,
    );

    expect(workout.blocks.map((result) => result.block.skill)).toEqual([
      "SWR2KG",
      "CD",
      "CARDIO_5",
      "GKS",
      "BR",
    ]);
    expect(workout.setList).toEqual([
      "SWR2KG 10",
      "CD 10",
      "CARDIO_5 10",
      "GKS 10",
      "BR 10",
    ]);
  });

  it("builds two blocks of one skill in template order", () => {
    const results = [
      generateFilledBranchesResult("CARDIO_5", "10"),
      generateFilledBranchesResult("GKS"),
      generateFilledBranchesResult("CARDIO_5", "11"),
    ];

    const workout = finishWorkout(
      results,
      { requiredBlocks: "none" },
      buildStubSetList,
    );

    expect(workout.setList).toEqual(["CARDIO_5 10", "GKS 10", "CARDIO_5 11"]);
  });

  it("builds a filled block of a skill whose later block is empty", () => {
    const results = [
      generateFilledBranchesResult("CARDIO_5", "10"),
      generateEmptyBranchesResult("CARDIO_5", generateEquipmentError([])),
    ];

    const workout = finishWorkout(
      results,
      { requiredBlocks: "none" },
      buildStubSetList,
    );

    expect(workout.setList).toEqual(["CARDIO_5 10"]);
  });

  it("drops the empty blocks and throws nothing while the set list holds an entry", () => {
    const results = [
      generateEmptyBranchesResult("SWR2KG", generateEquipmentError(["BAR"])),
      generateFilledBranchesResult("CD"),
    ];

    const workout = finishWorkout(
      results,
      { requiredBlocks: "none" },
      buildStubSetList,
    );

    expect(workout.blocks).toEqual([results[1]]);
    expect(workout.setList).toEqual(["CD 10"]);
  });

  it("throws the raw reason of the first empty block in template order on an empty set list", () => {
    const swrError = generateEquipmentError(["BARBELL"]);
    const gksError = generateEquipmentError(["DUMBBELL"]);
    const results = [
      generateEmptyBranchesResult("SWR2KG", swrError),
      generateEmptyBranchesResult("GKS", gksError),
    ];

    expect(
      catchThrownValue(() =>
        finishWorkout(results, { requiredBlocks: "none" }, buildStubSetList),
      ),
    ).toBe(swrError);
  });

  it("throws when the filled blocks build no set list entry", () => {
    const swrError = generateEquipmentError(["BARBELL"]);
    const templateOrders = [
      [
        generateEmptyBranchesResult("SWR2KG", swrError),
        generateFilledBranchesResult("GKS", "-1"),
      ],
      [
        generateFilledBranchesResult("GKS", "-1"),
        generateEmptyBranchesResult("SWR2KG", swrError),
      ],
    ];

    for (const results of templateOrders) {
      expect(
        catchThrownValue(() =>
          finishWorkout(results, { requiredBlocks: "none" }, buildStubSetList),
        ),
      ).toBe(swrError);
    }
  });

  it("skips empty blocks without a reason when it picks the error", () => {
    const gksError = generateEquipmentError(["DUMBBELL"]);
    const results = [
      generateEmptyBranchesResult("WUSPEZIAL", undefined),
      generateEmptyBranchesResult("GKS", gksError),
    ];

    expect(
      catchThrownValue(() =>
        finishWorkout(results, { requiredBlocks: "none" }, buildStubSetList),
      ),
    ).toBe(gksError);
  });

  it("returns an empty set list when every block is empty without a reason", () => {
    const results = [
      generateEmptyBranchesResult("PREVKNEE", undefined),
      generateEmptyBranchesResult("WUSPEZIAL", undefined),
    ];

    expect(
      finishWorkout(results, { requiredBlocks: "none" }, buildStubSetList),
    ).toEqual({ blocks: [], setList: [] });
  });

  it("keeps a prescribed result between the filled ones", () => {
    const results = [
      generateFilledBranchesResult("CD"),
      generatePrescribedResult("TEST", ["25"]),
      generateFilledBranchesResult("WU"),
    ];

    const workout = finishWorkout(
      results,
      { requiredBlocks: "none" },
      buildStubSetList,
    );

    expect(workout.setList).toEqual(["CD 10", "TEST 25", "WU 10"]);
  });

  it("hands the builder the prescribed result as a block", () => {
    const prescribed = generatePrescribedResult("TEST", ["25"]);

    const workout = finishWorkout(
      [prescribed],
      { requiredBlocks: "none" },
      buildStubSetList,
    );

    expect(workout.blocks).toEqual([prescribed]);
  });

  it("keeps every prescribed block of a skill", () => {
    const results = [
      generatePrescribedResult("TEST", ["25"]),
      generatePrescribedResult("TEST", ["50"]),
    ];

    const workout = finishWorkout(
      results,
      { requiredBlocks: "none" },
      buildStubSetList,
    );

    expect(workout.setList).toEqual(["TEST 25", "TEST 50"]);
  });

  it("throws the reason of an empty block for requiredBlocks every, though other blocks build entries", () => {
    const warmUpError = generateEquipmentError(["DUMBBELL"]);
    const results = [
      generateEmptyBranchesResult("WU", warmUpError),
      generatePrescribedResult("TEST", ["25"]),
    ];

    expect(
      catchThrownValue(() =>
        finishWorkout(results, { requiredBlocks: "every" }, buildStubSetList),
      ),
    ).toBe(warmUpError);
  });

  it("throws a SKILL_TREE error naming the skill for requiredBlocks every when the empty block has no reason", () => {
    const results = [
      generateEmptyBranchesResult("WU", undefined),
      generatePrescribedResult("TEST", ["25"]),
    ];

    expect(
      catchThrownValue(() =>
        finishWorkout(results, { requiredBlocks: "every" }, buildStubSetList),
      ),
    ).toEqual({ type: "NO_EXERCISES", subtype: "SKILL_TREE", params: ["WU"] });
  });

  it("leaves the given results unchanged", () => {
    const results = [
      generateFilledBranchesResult("CD"),
      generateFilledBranchesResult("BR"),
    ];

    finishWorkout(results, { requiredBlocks: "none" }, buildStubSetList);

    expect(results.map((result) => result.block.skill)).toEqual(["CD", "BR"]);
  });
});
