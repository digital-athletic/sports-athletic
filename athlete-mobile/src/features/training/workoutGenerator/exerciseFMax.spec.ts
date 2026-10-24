import { generateValueExercise } from "../../../../test/factories/valueExercise";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { readExerciseFMax } from "./exerciseFMax";

const maxValues: MaxValuesType = {
  ...DEFAULT_MAX_VALUES,
  verticalPush: { ...DEFAULT_MAX_VALUES.verticalPush, barbell: 100 },
  kneeDominant: { ...DEFAULT_MAX_VALUES.kneeDominant, barbell: 200 },
};

/**
 * Builds an exercise with exactly the given tags.
 *
 * generateTaggedExercise(["EQ_BARBELL"])
 * → { id: "1", tags: ["EQ_BARBELL"], isAdvanceByReps: true, ... }
 */
const generateTaggedExercise = (tags: string[], conversionFactor?: number) => ({
  ...generateValueExercise("repetition"),
  tags,
  conversionFactor,
});

describe("exerciseFMax: readExerciseFMax", () => {
  it.each([
    ["a two-sided barbell", ["EXERCISE_DIRECTION_VERTICAL_PUSH", "EQ_BARBELL"], 100],
    ["two-sided dumbbells", ["EXERCISE_DIRECTION_VERTICAL_PUSH", "EQ_DUMBBELL"], 42.5],
    [
      "a one-sided upper body exercise",
      ["EXERCISE_DIRECTION_VERTICAL_PUSH", "REGION_UPPER_BODY", "SIDE_ONE", "EQ_DUMBBELL"],
      42.5,
    ],
    [
      "a one-sided lower body dumbbell exercise",
      ["EXERCISE_DIRECTION_KNEE", "REGION_LOWER_BODY", "SIDE_ONE", "EQ_DUMBBELL"],
      45,
    ],
    [
      "a one-sided lower body barbell exercise",
      ["EXERCISE_DIRECTION_KNEE", "REGION_LOWER_BODY", "SIDE_ONE", "EQ_BARBELL"],
      90,
    ],
  ])("converts the 1RM for %s", (_title, tags, expected) => {
    expect(readExerciseFMax(generateTaggedExercise(tags), maxValues)).toBe(
      expected,
    );
  });

  it("uses the conversion factor the catalog authors", () => {
    expect(
      readExerciseFMax(
        generateTaggedExercise(["EXERCISE_DIRECTION_KNEE", "EQ_BARBELL"], 0.3),
        maxValues,
      ),
    ).toBe(60);
  });

  it("returns undefined without a movement direction or without its 1RM", () => {
    expect(
      readExerciseFMax(generateTaggedExercise(["EQ_BARBELL"]), maxValues),
    ).toBeUndefined();
    expect(
      readExerciseFMax(
        generateTaggedExercise(["EXERCISE_DIRECTION_HIP", "EQ_BARBELL"]),
        maxValues,
      ),
    ).toBeUndefined();
    expect(
      readExerciseFMax(
        generateTaggedExercise(["EXERCISE_DIRECTION_VERTICAL_PUSH"]),
        { ...maxValues, verticalPush: { barbell: Number.NaN } },
      ),
    ).toBeUndefined();
  });
});
