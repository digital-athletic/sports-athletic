import { generateMaxValues } from "@test/factories/maxValues";
import { generateTaggedExercise } from "@test/factories/valueExercise";
import { readExerciseFMax } from "./exerciseFMax";

// The 1RMs of a tested vertical push and knee movement.
const MAX_VALUES = generateMaxValues({ verticalPush: 100, kneeDominant: 200 });

describe("exerciseFMax: readExerciseFMax", () => {
  it.each([
    [
      "a two-sided barbell",
      ["EXERCISE_DIRECTION_VERTICAL_PUSH", "EQ_BARBELL"],
      100,
    ],
    [
      "two-sided dumbbells",
      ["EXERCISE_DIRECTION_VERTICAL_PUSH", "EQ_DUMBBELL"],
      42.5,
    ],
    [
      "a one-sided upper body exercise",
      [
        "EXERCISE_DIRECTION_VERTICAL_PUSH",
        "REGION_UPPER_BODY",
        "SIDE_ONE",
        "EQ_DUMBBELL",
      ],
      42.5,
    ],
    [
      "a one-sided lower body dumbbell exercise",
      [
        "EXERCISE_DIRECTION_KNEE",
        "REGION_LOWER_BODY",
        "SIDE_ONE",
        "EQ_DUMBBELL",
      ],
      45,
    ],
    [
      "a one-sided lower body barbell exercise",
      [
        "EXERCISE_DIRECTION_KNEE",
        "REGION_LOWER_BODY",
        "SIDE_ONE",
        "EQ_BARBELL",
      ],
      90,
    ],
  ])("converts the 1RM for %s", (_title, tags, expected) => {
    expect(
      readExerciseFMax(generateTaggedExercise("1", tags), MAX_VALUES),
    ).toBe(expected);
  });

  it("uses the conversion factor the catalog authors", () => {
    expect(
      readExerciseFMax(
        generateTaggedExercise("1", ["EXERCISE_DIRECTION_KNEE", "EQ_BARBELL"], {
          conversionFactor: 0.3,
        }),
        MAX_VALUES,
      ),
    ).toBe(60);
  });

  it("returns undefined without a movement direction or without its 1RM", () => {
    expect(
      readExerciseFMax(generateTaggedExercise("1", ["EQ_BARBELL"]), MAX_VALUES),
    ).toBeUndefined();
    expect(
      readExerciseFMax(
        generateTaggedExercise("1", ["EXERCISE_DIRECTION_HIP", "EQ_BARBELL"]),
        MAX_VALUES,
      ),
    ).toBeUndefined();
    expect(
      readExerciseFMax(
        generateTaggedExercise("1", ["EXERCISE_DIRECTION_VERTICAL_PUSH"]),
        { ...MAX_VALUES, verticalPush: { barbell: Number.NaN } },
      ),
    ).toBeUndefined();
  });
});
