import { generateBranchReference } from "@test/factories/branchReference";
import { isBigMuscleExercise, readPrimaryMuscleGroups } from "./muscleGroups";

describe("muscleGroups: readPrimaryMuscleGroups", () => {
  it("counts a muscle of one side as its muscle group", () => {
    const entry = generateBranchReference("1", [
      "REGION_LOWER_BODY",
      "MUSCLE_QUADRICEPS_LEFT",
      "MUSCLE_CALF",
    ]);

    expect(readPrimaryMuscleGroups(entry)).toEqual(["QUADRICEPS", "CALF"]);
  });
});

describe("muscleGroups: isBigMuscleExercise", () => {
  it.each([
    ["MUSCLE_CHEST", true],
    ["MUSCLE_HAMSTRINGS_RIGHT", true],
    ["MUSCLE_INNER_THIGH", false],
    ["REGION_CORE", false],
  ])("reads %s as big: %s", (tag, isBig) => {
    expect(isBigMuscleExercise(generateBranchReference("1", [tag]))).toBe(
      isBig,
    );
  });
});
