import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import {
  generateBranchReference,
  generateReferenceCatalog,
} from "@test/factories/branchReference";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { pairBranchExercises } from "./exercisePairing";

/**
 * Lists the exercise IDs of each pair.
 *
 * listPairExerciseIds([{ first: front, second: rear }, { first: biceps }])
 * → [["ef", "er"], ["eb"]]
 */
const listPairExerciseIds = (pairs: ExercisePair[]) =>
  pairs.map(({ first, second }) =>
    second ? [first.exerciseId, second.exerciseId] : [first.exerciseId],
  );

describe("supersetPairingRules: big muscle groups lead", () => {
  it.each([
    ["QUADRICEPS", "REGION_LOWER_BODY"],
    ["HAMSTRINGS", "REGION_LOWER_BODY"],
    ["UPPER_BACK", "REGION_UPPER_BODY"],
  ])(
    "leads with a %s exercise before a small muscle exercise",
    (muscle, region) => {
      const big = generateBranchReference("big", [`MUSCLE_${muscle}`, region]);
      const biceps = generateBranchReference("b", [
        "MUSCLE_BICEPS",
        "REGION_UPPER_BODY",
      ]);
      const branches = [big, biceps];

      const pairs = pairBranchExercises(
        branches,
        generateReferenceCatalog(branches),
        "none",
        generateSequenceRandom([]),
      );

      expect(pairs[0].first.branchId).toBe("big");
    },
  );
});

describe("supersetPairingRules: superset partner", () => {
  it("pairs a front shoulder exercise with a rear shoulder exercise", () => {
    const rear = generateBranchReference("r", [
      "MUSCLE_SHOULDER_REAR",
      "REGION_UPPER_BODY",
    ]);
    const front = generateBranchReference("f", [
      "MUSCLE_SHOULDER_FRONT",
      "REGION_UPPER_BODY",
    ]);
    const branches = [rear, front];

    const pairs = pairBranchExercises(
      branches,
      generateReferenceCatalog(branches),
      "muscles",
      generateSequenceRandom([0]),
    );

    expect(listPairExerciseIds(pairs)).toEqual([["ef", "er"]]);
  });
});
