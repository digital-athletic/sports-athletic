import type {
  BranchExerciseReference,
  ExercisePair,
} from "@/features/training/models/ExerciseBranch";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { generateSequenceRandom } from "../../../../test/factories/sequenceRandom";
import { generateValueExercise } from "../../../../test/factories/valueExercise";
import {
  isBuildablePair,
  listOpposingMuscles,
  pairBranchExercises,
  pairCardioBranches,
} from "./exercisePairing";

/**
 * Fakes a two sided branch reference with the exercise ID `e<id>`.
 *
 * generateBranchReference("c", ["MUSCLE_CHEST"])
 * → { branchId: "c", exerciseId: "ec", branchTags: ["SIDE_BOTH", "MUSCLE_CHEST"] }
 */
const generateBranchReference = (
  id: string,
  tags: string[],
): BranchExerciseReference => ({
  branchId: id,
  exerciseId: `e${id}`,
  branchTags: ["SIDE_BOTH", ...tags],
});

/**
 * Fakes a one sided branch reference whose catalog exercise names its other side
 * `e<id>Right`.
 *
 * generateOneSidedReference("lunge", ["MUSCLE_QUADRICEPS"])
 * → { branchId: "lunge", exerciseId: "elunge", branchTags: ["SIDE_ONE", "MUSCLE_QUADRICEPS"] }
 */
const generateOneSidedReference = (
  id: string,
  tags: string[],
): BranchExerciseReference => ({
  branchId: id,
  exerciseId: `e${id}`,
  branchTags: ["SIDE_ONE", ...tags],
});

/**
 * Builds a catalog exercise for each reference; a one sided one names its other
 * side `<exerciseId>Right`.
 *
 * generateCatalog([generateOneSidedReference("lunge", [])])
 * → [{ ...exercise, id: "elunge", otherSideExerciseId: "elungeRight" }]
 */
const generateCatalog = (branches: BranchExerciseReference[]): ExerciseType[] =>
  branches.map((entry) => ({
    ...generateValueExercise("repetition"),
    id: entry.exerciseId,
    tags: entry.branchTags,
    otherSideExerciseId: entry.branchTags.includes("SIDE_ONE")
      ? `${entry.exerciseId}Right`
      : undefined,
  }));

const toExerciseIds = (pairs: ExercisePair[]) =>
  pairs.map(({ first, second }) =>
    second ? [first.exerciseId, second.exerciseId] : [first.exerciseId],
  );

const chest = generateBranchReference("c", [
  "MUSCLE_CHEST",
  "REGION_UPPER_BODY",
]);
const latissimus = generateBranchReference("l", [
  "MUSCLE_LATISSIMUS",
  "REGION_UPPER_BODY",
]);
const biceps = generateBranchReference("b", [
  "MUSCLE_BICEPS",
  "REGION_UPPER_BODY",
]);

describe("exercisePairing: listOpposingMuscles", () => {
  it.each([
    [["CHEST"], ["LATISSIMUS", "NECK", "UPPER_BACK"]],
    [["LATISSIMUS"], ["CHEST"]],
    [["BICEPS"], ["TRICEPS"]],
    [
      ["SHIN", "GLUTES", "OBLIQUES"],
      ["CALF", "QUADRICEPS"],
    ],
  ])("lists the opposing muscles of %j", (muscles, opposing) => {
    expect(listOpposingMuscles(muscles)).toEqual(opposing);
  });
});

describe("exercisePairing: pairBranchExercises with muscle pairing", () => {
  it("pairs opposing muscles with one draw per partner", () => {
    const random = jest.fn(generateSequenceRandom([0]));

    const pairs = pairBranchExercises(
      [chest, latissimus],
      generateCatalog([chest, latissimus]),
      "muscles",
      random,
    );

    expect(toExerciseIds(pairs)).toEqual([["el", "ec"]]);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it("leads with big muscle groups and treats the inner thigh as small", () => {
    const innerThigh = generateBranchReference("i", [
      "MUSCLE_INNER_THIGH",
      "REGION_LOWER_BODY",
    ]);
    const branches = [biceps, chest, innerThigh];

    const pairs = pairBranchExercises(
      branches,
      generateCatalog(branches),
      "muscles",
      generateSequenceRandom([0]),
    );

    expect(toExerciseIds(pairs)).toEqual([["ec", "ei"], ["eb"]]);
  });

  it("pairs a one sided exercise with its other side and never as a partner", () => {
    const lunge = generateOneSidedReference("lunge", [
      "MUSCLE_QUADRICEPS",
      "REGION_LOWER_BODY",
    ]);
    const squat = generateBranchReference("squat", [
      "MUSCLE_GLUTES",
      "REGION_LOWER_BODY",
    ]);

    const pairs = pairBranchExercises(
      [lunge, squat],
      generateCatalog([lunge, squat]),
      "muscles",
      generateSequenceRandom([]),
    );

    expect(toExerciseIds(pairs)).toEqual([
      ["esquat"],
      ["elunge", "elungeRight"],
    ]);
    expect(pairs[1].second?.branchId).toBe("lunge");
  });
});

describe("exercisePairing: pairBranchExercises without muscle pairing", () => {
  it("keeps every exercise single, the last drawn first", () => {
    const pairs = pairBranchExercises(
      [chest, latissimus],
      generateCatalog([chest, latissimus]),
      "none",
      generateSequenceRandom([]),
    );

    expect(toExerciseIds(pairs)).toEqual([["el"], ["ec"]]);
  });

  it("drops a big muscle lead missing from the catalog and keeps a small one", () => {
    const pairs = pairBranchExercises(
      [chest, biceps],
      [],
      "none",
      generateSequenceRandom([]),
    );

    expect(toExerciseIds(pairs)).toEqual([["eb"]]);
  });

  it("drops a lead whose stored reference lacks an exercise ID", () => {
    const withoutExercise = {
      branchId: "x",
      branchTags: ["MUSCLE_BICEPS"],
    } as BranchExerciseReference;

    const pairs = pairBranchExercises(
      [withoutExercise, biceps],
      generateCatalog([biceps]),
      "none",
      generateSequenceRandom([]),
    );

    expect(toExerciseIds(pairs)).toEqual([["eb"]]);
  });

  it("returns no pairs without branches", () => {
    expect(
      pairBranchExercises([], [], "muscles", generateSequenceRandom([])),
    ).toEqual([]);
  });

  it("pairs in draw order and joins the first single with the last one", () => {
    const branches = [
      generateBranchReference("a", ["MUSCLE_BICEPS"]),
      generateOneSidedReference("o", ["MUSCLE_CALF"]),
      generateBranchReference("b", []),
      generateOneSidedReference("p", ["MUSCLE_CALF"]),
      generateBranchReference("z", ["MUSCLE_QUADRICEPS"]),
    ];
    const catalog = generateCatalog(branches);
    const random = generateSequenceRandom([]);

    expect(
      toExerciseIds(
        pairBranchExercises(branches, catalog, "drawOrder", random),
      ),
    ).toEqual([["ea"], ["eo", "eoRight"], ["eb"], ["ep", "epRight"], ["ez"]]);
    expect(
      toExerciseIds(
        pairBranchExercises(
          branches,
          catalog,
          "drawOrderWithLeftovers",
          random,
        ),
      ),
    ).toEqual([["ea", "ez"], ["eo", "eoRight"], ["eb"], ["ep", "epRight"]]);
  });

  it("pairs two exercises that follow each other in draw order", () => {
    const branches = [biceps, chest, latissimus];

    expect(
      toExerciseIds(
        pairBranchExercises(
          branches,
          generateCatalog(branches),
          "drawOrder",
          generateSequenceRandom([]),
        ),
      ),
    ).toEqual([["eb", "ec"], ["el"]]);
  });
});

describe("exercisePairing: pairCardioBranches", () => {
  const run = { branchTags: ["CARDIO_RUN"], exerciseId: "run" };

  it.each([
    ["CARDIO_4", [{ first: run }]],
    ["CARDIO_5", [{ first: run }]],
    ["CARDIO_2", []],
  ])("pairs the branches of %s", (skill, pairs) => {
    expect(pairCardioBranches(skill, [run])).toEqual(pairs);
  });
});

describe("exercisePairing: isBuildablePair", () => {
  const exerciseMap = new Map(
    generateCatalog([chest]).map((exercise) => [exercise.id, exercise]),
  );
  const pause = { ...latissimus, exerciseId: "-1" };

  it.each<[string, ExercisePair, boolean]>([
    ["a catalog exercise", { first: chest, second: latissimus }, true],
    ["a pause lead", { first: pause }, false],
    ["a lead missing from the catalog", { first: latissimus }, false],
    ["a pause partner", { first: chest, second: pause }, false],
  ])("reads %s", (_, pair, isBuildable) => {
    expect(isBuildablePair(pair, exerciseMap)).toBe(isBuildable);
  });
});
