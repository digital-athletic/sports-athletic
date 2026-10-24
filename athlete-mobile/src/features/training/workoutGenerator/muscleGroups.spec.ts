import { isBigMuscleExercise, readPrimaryMuscleGroups } from "./muscleGroups";

/**
 * Fakes a branch reference with the given tags.
 *
 * generateBranchReference(["MUSCLE_CHEST"])
 * → { branchId: "1", exerciseId: "e1", branchTags: ["MUSCLE_CHEST"] }
 */
const generateBranchReference = (branchTags: string[]) => ({
  branchId: "1",
  exerciseId: "e1",
  branchTags,
});

describe("muscleGroups: readPrimaryMuscleGroups", () => {
  it("counts a side-specific muscle as its muscle group", () => {
    const entry = generateBranchReference([
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
    expect(isBigMuscleExercise(generateBranchReference([tag]))).toBe(isBig);
  });
});
