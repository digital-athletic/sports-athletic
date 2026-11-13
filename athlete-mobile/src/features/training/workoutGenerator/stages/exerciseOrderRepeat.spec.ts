import { generateExerciseUnit } from "@test/factories/exercisePair";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { orderExerciseUnits } from "./exerciseOrder";

describe("exerciseOrder: repeat across a skill boundary", () => {
  it("keeps the repeat when the only unit holds the exercise that ended the previous skill", () => {
    const orderedUnits = orderExerciseUnits(
      [generateExerciseUnit("push", "U", "CHEST")],
      { lowerBodyFirst: false, previousExerciseId: "epush" },
      generateSequenceRandom([0]),
    );

    expect(orderedUnits.map((unit) => unit.first.exerciseId)).toEqual([
      "epush",
    ]);
  });
});
