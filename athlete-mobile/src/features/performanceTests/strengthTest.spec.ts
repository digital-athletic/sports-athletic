import { loadStrengthTest } from "@/data/loadStrengthTest";
import { type SportTest } from "./models/SportTest";
import {
  entryBodyWeight,
  relativeOneRepMax,
  STRENGTH_TEST_EXERCISE_IDS,
  strengthTestExerciseId,
} from "./strengthTest";
import { generateSportTest } from "./testFixtures";

/** A test measured in seconds with the code, e.g. generateTestWithCode("SQUAT").code is "SQUAT". */
const generateTestWithCode = (code: string): SportTest =>
  generateSportTest(code);

describe("strengthTestExerciseId: mapped codes", () => {
  it.each([
    ["SQUAT", "25"],
    ["DEADLIFT", "50"],
    ["BENCH_PRESS", "342"],
    ["ROW", "297"],
    ["SHOULDER_PRESS", "54"],
  ])("maps %s to the exercise %s", (code, exerciseId) => {
    expect(strengthTestExerciseId(generateTestWithCode(code))).toBe(exerciseId);
  });

  it.each([
    ["lower case", "bench_press"],
    ["no separator", "BENCHPRESS"],
    ["a space", "Bench Press"],
    ["a hyphen", "bench-press"],
    ["surrounding spaces", "  BENCH_PRESS "],
  ])("matches a code with %s", (_label, code) => {
    expect(strengthTestExerciseId(generateTestWithCode(code))).toBe("342");
  });
});

describe("strengthTestExerciseId: other tests", () => {
  it("is null for a sprint test", () => {
    expect(
      strengthTestExerciseId(generateTestWithCode("SPRINT_5M")),
    ).toBeNull();
  });

  it("is null for a code that only contains a strength test code", () => {
    expect(
      strengthTestExerciseId(generateTestWithCode("SQUAT_JUMP")),
    ).toBeNull();
  });
});

describe("STRENGTH_TEST_EXERCISE_IDS", () => {
  it("holds exactly the lifts of the bundled strength test", () => {
    const lifts = loadStrengthTest().lifts.BEGINNER.default;

    expect(Object.values(STRENGTH_TEST_EXERCISE_IDS).sort()).toEqual(
      [...lifts].sort(),
    );
  });
});

describe("relativeOneRepMax", () => {
  it("divides the lifted weight by the body weight", () => {
    expect(relativeOneRepMax(90, 60)).toBe(1.5);
  });

  it("rounds to two decimals", () => {
    expect(relativeOneRepMax(100, 75)).toBe(1.33);
  });

  it("is 0 for no lifted weight", () => {
    expect(relativeOneRepMax(0, 60)).toBe(0);
  });
});

describe("entryBodyWeight", () => {
  it("returns the body weight for a strength test", () => {
    expect(entryBodyWeight(generateTestWithCode("SQUAT"), 72)).toBe(72);
  });

  it("returns null for another test", () => {
    expect(entryBodyWeight(generateTestWithCode("SPRINT_5M"), 72)).toBeNull();
  });

  it.each([
    ["a missing", undefined],
    ["a zero", 0],
    ["a negative", -5],
    ["a non finite", Number.NaN],
  ])("returns null for %s body weight", (_label, weight) => {
    expect(entryBodyWeight(generateTestWithCode("SQUAT"), weight)).toBeNull();
  });
});
