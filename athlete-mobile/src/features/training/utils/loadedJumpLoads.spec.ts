import { getExerciseById } from "@/data/exerciseRegistry";
import type { ExerciseType } from "@/schemas/exercise.schema";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import SA from "../../../../assets/data/generator/skillTrees/SA.json";
import TrainingGenerator, {
  getIntensityBySkill,
} from "../generators/TrainingGenerator";
import {
  DEFAULT_MAX_VALUE,
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "../models/MaxValues";
import {
  calculateWeightStep,
  getLowestPermittedWeight,
  getTargetWeight,
} from "./weightAdjustmentUtils";
import {
  deriveWeightForExercise,
  getExerciseStartValue,
  getExerciseTargetValue,
  getMaxValueForExercise,
} from "./workoutUtils";

const LEVELS = [
  { level: "beginner", start: 5, target: 10 },
  { level: "advanced", start: 10, target: 20 },
  { level: "professional", start: 10, target: 20 },
] as const;

const intensity = getIntensityBySkill("SK");
const maxValues: MaxValuesType = {
  ...DEFAULT_MAX_VALUES,
  kneeDominant: { ...DEFAULT_MAX_VALUE, barbell: 100 },
};

const exercise = (id: string): ExerciseType => {
  const found = getExerciseById(id);
  if (!found) throw new Error(`Exercise ${id} missing`);
  return found;
};

describe("loaded jumps: default load limits without catalog values", () => {
  describe.each(["295", "880"])("jumped dumbbell lunge %s", (id) => {
    it.each(LEVELS)(
      "$level starts at $start% and targets $target% of the knee 1RM",
      ({ level, start, target }) => {
        for (const gender of ["m", "w"] as const) {
          expect(
            getExerciseStartValue(
              intensity,
              exercise(id),
              "weight",
              level,
              gender,
            ),
          ).toBe(start);
          expect(
            getExerciseTargetValue(
              intensity,
              exercise(id),
              "weight",
              level,
              gender,
            ),
          ).toBe(target);
        }
      },
    );

    it.each(LEVELS)(
      "$level: the generator starts the new exercise at $start% of F-Max",
      ({ level, start }) => {
        const values = new TrainingGenerator().getExerciseValues(
          null,
          exercise(id),
          intensity,
          "m",
          level,
          maxValues,
          "SK",
        );

        expect(values.weight).toBe(start);
        expect(values.weightType).toBe("weightFMax");
      },
    );

    it.each(LEVELS)(
      "$level: the target weight is $target% of F-Max",
      ({ level, target }) => {
        expect(
          getTargetWeight(intensity, exercise(id), {
            userLevel: level,
            genderTag: "m",
            maxValue: getMaxValueForExercise(exercise(id), maxValues),
          }),
        ).toBe(target);
      },
    );
  });
});

describe("loaded jumps: lowest permitted load equals the start load", () => {
  it.each(
    ["292", "294", "295", "880"].flatMap((id) =>
      LEVELS.map((entry) => ({ id, ...entry })),
    ),
  )("exercise $id, $level: $start%", ({ id, level, start }) => {
    expect(
      getLowestPermittedWeight(intensity, "weightFMax", exercise(id), {
        userLevel: level,
        genderTag: "m",
      }),
    ).toBe(start);
  });

  it("keeps the load after too hard at the lowest load", () => {
    const lowest = getLowestPermittedWeight(
      intensity,
      "weightFMax",
      exercise("295"),
      { userLevel: "beginner", genderTag: "m" },
    );

    const step = calculateWeightStep(5, "DECREASE", exercise("295"), {
      weightType: "weightFMax",
      lowestWeight: lowest,
      maxValue: getMaxValueForExercise(exercise("295"), maxValues),
    });

    expect(step.weight).toBe(5);
    expect(step.load).toBe(1);
  });
});

describe("loaded jumps: equipment conversion of the knee 1RM", () => {
  it.each([
    { id: "295", name: "jumped dumbbell lunge left", expected: 30 },
    { id: "880", name: "jumped dumbbell lunge right", expected: 30 },
    { id: "294", name: "dumbbell jump squat", expected: 42.5 },
    { id: "292", name: "barbell jump squat", expected: 100 },
  ])("$name ($id): $expected kg", ({ id, expected }) => {
    expect(getMaxValueForExercise(exercise(id), maxValues)).toBeCloseTo(
      expected,
      6,
    );
  });

  it.each([
    { id: "295", level: "advanced", start: 3, target: 6 },
    { id: "880", level: "beginner", start: 1, target: 3 },
  ] as const)(
    "lunge $id, $level: $start kg up to $target kg per dumbbell",
    ({ id, level, start, target }) => {
      const load = (percent: number) =>
        deriveWeightForExercise(
          percent,
          "weightFMax",
          exercise(id),
          maxValues,
        );
      const entry = LEVELS.find((l) => l.level === level);

      expect(load(entry?.start ?? 0)).toBe(start);
      expect(load(entry?.target ?? 0)).toBe(target);
    },
  );
});

describe("power endurance duplicates with broken weights", () => {
  const removed = ["291", "293", "296", "881"];

  it.each(removed)("exercise %s is gone from the catalog", (id) => {
    const exists = (ExercisesData as unknown as ExerciseType[]).some(
      (e) => e.id === id,
    );
    expect(exists).toBe(false);
  });

  it("no skill tree branch of SA references them", () => {
    const referenced = Object.values(
      SA as Record<string, { levels: Record<string, { exerciseId: string }> }>,
    ).flatMap((branch) =>
      Object.values(branch.levels).map((level) => level.exerciseId),
    );
    expect(referenced.filter((id) => removed.includes(id))).toEqual([]);
  });

  it("no exercise points to them as other side", () => {
    const others = (ExercisesData as unknown as ExerciseType[]).map(
      (e) => e.otherSideExerciseId,
    );
    expect(others.filter((id) => id && removed.includes(id))).toEqual([]);
  });
});
