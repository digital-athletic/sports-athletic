import {
  generateEmptyBranchesResult,
  generateFilledBranchesResult,
} from "@test/factories/blockResult";
import { generateEquipmentError } from "@test/factories/generatorError";
import { catchThrownValue } from "@test/factories/thrownValue";
import {
  type FilledBlockResult,
  finishWorkout,
  SHORT_WORKOUT_FINISH_RULES,
  TRAINING_DAY_FINISH_RULES,
} from "./workoutFinish";

/**
 * Stub set list builder: one entry per exercise, dropping the exercise ID
 * "-1" of a branch without a catalog exercise, as the old builder does.
 *
 * buildStubSetList([GKS with exercises "10" and "-1"]) → ["GKS 10"]
 */
const buildStubSetList = (blocks: FilledBlockResult[]): string[] =>
  blocks.flatMap((result) =>
    result.exercises
      .filter((exercise) => exercise.exerciseId !== "-1")
      .map((exercise) => `${result.block.skill} ${exercise.exerciseId}`),
  );

describe("workoutFinish: finishWorkout", () => {
  it("builds the filled blocks of a training day in section order", () => {
    const results = [
      generateFilledBranchesResult("SWR2KG"),
      generateFilledBranchesResult("CD"),
      generateFilledBranchesResult("CARDIO_5"),
      generateFilledBranchesResult("GKS"),
      generateFilledBranchesResult("BR"),
    ];

    const workout = finishWorkout(
      results,
      TRAINING_DAY_FINISH_RULES,
      buildStubSetList,
    );

    expect(workout.setList).toEqual([
      "BR 10",
      "GKS 10",
      "SWR2KG 10",
      "CARDIO_5 10",
      "CD 10",
    ]);
    expect(workout.blocks.map((result) => result.block.skill)).toEqual([
      "BR",
      "GKS",
      "SWR2KG",
      "CARDIO_5",
      "CD",
    ]);
  });

  it("builds the filled blocks of a short workout in template order", () => {
    const results = [
      generateFilledBranchesResult("CD"),
      generateFilledBranchesResult("WU"),
    ];

    const workout = finishWorkout(
      results,
      SHORT_WORKOUT_FINISH_RULES,
      buildStubSetList,
    );

    expect(workout.setList).toEqual(["CD 10", "WU 10"]);
  });

  it("hands the builder every block result in template order", () => {
    const results = [
      generateFilledBranchesResult("CD"),
      generateEmptyBranchesResult("WU", undefined),
      generateFilledBranchesResult("BR"),
    ];

    const workout = finishWorkout(
      results,
      TRAINING_DAY_FINISH_RULES,
      (_blocks, allResults) =>
        allResults.map((result) => `${result.block.skill} ${result.status}`),
    );

    expect(workout.setList).toEqual(["CD filled", "WU empty", "BR filled"]);
  });

  it("drops the empty blocks and throws nothing while the set list holds an entry", () => {
    const results = [
      generateEmptyBranchesResult("SWR2KG", generateEquipmentError(["BAR"])),
      generateFilledBranchesResult("CD"),
    ];

    const workout = finishWorkout(
      results,
      TRAINING_DAY_FINISH_RULES,
      buildStubSetList,
    );

    expect(workout.blocks).toEqual([results[1]]);
    expect(workout.setList).toEqual(["CD 10"]);
  });

  it("throws the raw reason of the first empty skill in stored order on an empty training day", () => {
    const swrError = generateEquipmentError(["BARBELL"]);
    const gksError = generateEquipmentError(["DUMBBELL"]);
    const results = [
      generateEmptyBranchesResult("SWR2KG", swrError),
      generateEmptyBranchesResult("GKS", gksError),
    ];

    expect(
      catchThrownValue(() =>
        finishWorkout(results, TRAINING_DAY_FINISH_RULES, buildStubSetList),
      ),
    ).toBe(swrError);
  });

  it("throws when the filled blocks build no set list entry", () => {
    const swrError = generateEquipmentError(["BARBELL"]);
    const storedOrders = [
      [
        generateEmptyBranchesResult("SWR2KG", swrError),
        generateFilledBranchesResult("GKS", "-1"),
      ],
      [
        generateFilledBranchesResult("GKS", "-1"),
        generateEmptyBranchesResult("SWR2KG", swrError),
      ],
    ];

    for (const results of storedOrders) {
      expect(
        catchThrownValue(() =>
          finishWorkout(results, TRAINING_DAY_FINISH_RULES, buildStubSetList),
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
        finishWorkout(results, TRAINING_DAY_FINISH_RULES, buildStubSetList),
      ),
    ).toBe(gksError);
  });

  it("returns an empty set list when every block is empty without a reason", () => {
    const results = [
      generateEmptyBranchesResult("PREVKNEE", undefined),
      generateEmptyBranchesResult("WUSPEZIAL", undefined),
    ];

    expect(
      finishWorkout(results, TRAINING_DAY_FINISH_RULES, buildStubSetList),
    ).toEqual({ blocks: [], setList: [] });
  });

  it("never throws for an empty short workout, even with a reason", () => {
    const results = [
      generateEmptyBranchesResult("WU", generateEquipmentError(["DUMBBELL"])),
    ];

    expect(
      finishWorkout(results, SHORT_WORKOUT_FINISH_RULES, buildStubSetList),
    ).toEqual({ blocks: [], setList: [] });
  });

  // a stored day holds one entry per skill, so a swapped CARDIO_5 replaces a stored one
  it("builds only the last block of a skill on a training day", () => {
    const results = [
      generateFilledBranchesResult("CARDIO_5", "10"),
      generateFilledBranchesResult("GKS"),
      generateFilledBranchesResult("CARDIO_5", "11"),
    ];

    const workout = finishWorkout(
      results,
      TRAINING_DAY_FINISH_RULES,
      buildStubSetList,
    );

    expect(workout.setList).toEqual(["GKS 10", "CARDIO_5 11"]);
  });

  it("drops an earlier filled block of a skill when a later block of it is empty", () => {
    const results = [
      generateFilledBranchesResult("CARDIO_5", "10"),
      generateFilledBranchesResult("GKS"),
      generateEmptyBranchesResult("CARDIO_5", generateEquipmentError([])),
    ];

    const workout = finishWorkout(
      results,
      TRAINING_DAY_FINISH_RULES,
      buildStubSetList,
    );

    expect(workout.setList).toEqual(["GKS 10"]);
  });

  it("still throws the reason of a block that a later block of its skill replaced", () => {
    const cardioError = generateEquipmentError(["TREADMILL"]);
    const results = [
      generateEmptyBranchesResult("CARDIO_5", cardioError),
      generateFilledBranchesResult("CARDIO_5", "-1"),
    ];

    expect(
      catchThrownValue(() =>
        finishWorkout(results, TRAINING_DAY_FINISH_RULES, buildStubSetList),
      ),
    ).toBe(cardioError);
  });

  it("builds every block of a skill in a short workout", () => {
    const results = [
      generateFilledBranchesResult("MOB", "10"),
      generateFilledBranchesResult("MOB", "11"),
    ];

    const workout = finishWorkout(
      results,
      SHORT_WORKOUT_FINISH_RULES,
      buildStubSetList,
    );

    expect(workout.setList).toEqual(["MOB 10", "MOB 11"]);
  });

  it("leaves the given results unchanged", () => {
    const results = [
      generateFilledBranchesResult("CD"),
      generateFilledBranchesResult("BR"),
    ];

    finishWorkout(results, TRAINING_DAY_FINISH_RULES, buildStubSetList);

    expect(results.map((result) => result.block.skill)).toEqual(["CD", "BR"]);
  });
});
