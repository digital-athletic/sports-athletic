import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { Block } from "@/schemas/aiwl.schema";
import type { BlockResult } from "./blockWalk";
import {
  type FilledBlockResult,
  finishWorkout,
  SHORT_WORKOUT_FINISH_RULES,
  TRAINING_DAY_FINISH_RULES,
} from "./workoutFinish";

/**
 * Builds a filled result for a branches block of the skill whose one branch
 * resolves to the given exercise ID.
 *
 * generateFilledBranchesResult("GKS", "10")
 * → { status: "filled", block: { kind: "branches", skill: "GKS", branches: ["1"] },
 *     usedBranchIds: ["1"], exercises: [{ branchId: "1", branchTags: [], exerciseId: "10" }] }
 */
const generateFilledBranchesResult = (
  skill: Block["skill"],
  exerciseId = "10",
): BlockResult => ({
  status: "filled",
  block: { kind: "branches", skill, branches: ["1"] },
  usedBranchIds: ["1"],
  exercises: [{ branchId: "1", branchTags: [], exerciseId }],
});

/**
 * Builds an empty result for a branches block of the skill.
 *
 * generateEmptyBranchesResult("GKS", equipmentError)
 * → { status: "empty", block: { kind: "branches", skill: "GKS", branches: ["1"] },
 *     reason: equipmentError, usedBranchIds: [] }
 */
const generateEmptyBranchesResult = (
  skill: Block["skill"],
  reason: GeneratorError | undefined,
): BlockResult => ({
  status: "empty",
  block: { kind: "branches", skill, branches: ["1"] },
  reason,
  usedBranchIds: [],
});

/**
 * Builds the equipment error the old generator records for an emptied skill.
 *
 * generateEquipmentError(["DUMBBELL"])
 * → { type: "NO_EXERCISES", subtype: "EQUIPMENT", params: ["DUMBBELL"] }
 */
const generateEquipmentError = (params: string[]): GeneratorError => ({
  type: "NO_EXERCISES",
  subtype: "EQUIPMENT",
  params,
});

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

/**
 * Runs the function and returns the value it throws, or undefined.
 *
 * catchThrownValue(() => { throw gksError; }) → gksError
 */
const catchThrownValue = (run: () => unknown): unknown => {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
};

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

  it("leaves the given results unchanged", () => {
    const results = [
      generateFilledBranchesResult("CD"),
      generateFilledBranchesResult("BR"),
    ];

    finishWorkout(results, TRAINING_DAY_FINISH_RULES, buildStubSetList);

    expect(results.map((result) => result.block.skill)).toEqual(["CD", "BR"]);
  });
});
