import {
  generateAuthoredValues,
  generateValueExercise,
} from "../../../../test/factories/valueExercise";
import { loadExercises } from "@/data/loadExercises";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import { readExerciseValues } from "./exerciseValues";

const GENDERS: GenderTag[] = ["m", "w", "k"];
const LEVELS = ["beginner", "intermediate", "advanced", "professional"];

const readCatalogExercise = (id: string): ExerciseType => {
  const exercise = loadExercises().find((entry) => entry.id === id);
  if (!exercise) throw new Error(`Exercise ${id} missing from the catalog`);
  return exercise;
};

/**
 * Builds stored exercise data of one exercise.
 *
 * generateStoredValues({ repetition: 10 })
 * → { exerciseId: "1", skill: "SWR2", repetition: 10 }
 */
const generateStoredValues = (
  values: Partial<UserExerciseDataType>,
): UserExerciseDataType => ({ exerciseId: "1", skill: "SWR2", ...values });

const advancedMan = { gender: "m", level: "advanced" } as const;

describe("exerciseValues: speed warm-up", () => {
  const readDuration = (
    exercise: ExerciseType,
    stored: UserExerciseDataType | null,
    athlete: { gender: GenderTag; level: string } = advancedMan,
  ) =>
    readExerciseValues(
      { intensity: loadIntensityConfig("WUSKSA"), exercise, ...athlete },
      stored,
      "WUSKSA",
    ).duration;

  it.each(GENDERS.flatMap((gender) => LEVELS.map((level) => [gender, level])))(
    "ladder 721 starts at 30 seconds and fast push-ups 433 and 434 at 15 for gender %s and level %s",
    (gender, level) => {
      const athlete = { gender: gender as GenderTag, level };
      expect(readDuration(readCatalogExercise("721"), null, athlete)).toBe(30);
      expect(readDuration(readCatalogExercise("433"), null, athlete)).toBe(15);
      expect(readDuration(readCatalogExercise("434"), null, athlete)).toBe(15);
    },
  );

  it.each([
    ["no authored value", {}, null, 30],
    ["an authored 45 to 60", { duration: generateAuthoredValues("45", "60") }, null, 30],
    ["an authored 20 to 20", { duration: generateAuthoredValues("20", "20") }, null, 20],
    ["a stored 50", {}, 50, 30],
  ] as const)(
    "caps %s at 30 seconds",
    (_title, values, stored, expected) => {
      const exercise = generateValueExercise("duration", { values });

      expect(
        readDuration(
          exercise,
          stored === null ? null : generateStoredValues({ duration: stored }),
        ),
      ).toBe(expected);
    },
  );
});

describe("exerciseValues: authored values", () => {
  // The catalog schema allows no null, but stored JSON may hold one.
  it.each([
    ["an empty string", ""],
    ["null", null as unknown as string],
  ])(
    "falls back to the default entry when the gender value is %s",
    (_title, genderValue) => {
      const exercise = generateValueExercise("duration", {
        values: {
          duration: {
            startValue: {
              default: { default: 25 },
              m: { default: genderValue },
            },
            targetValue: { default: { default: 25 } },
          },
        },
      });

      expect(
        readExerciseValues(
          { intensity: loadIntensityConfig("SA"), exercise, ...advancedMan },
          null,
          "SA",
        ).duration,
      ).toBe(25);
    },
  );

  it("starts a new exercise at the hypertrophy start despite authored values", () => {
    const exercise = generateValueExercise("repetition", {
      withWeights: true,
      values: { repetition: generateAuthoredValues("10", "15") },
    });
    const context = {
      intensity: loadIntensityConfig("SWR2"),
      exercise,
      ...advancedMan,
    };

    expect(readExerciseValues(context, null)).toEqual({
      repetition: 8,
      weight: 70,
      weightType: "weightFMax",
    });
    expect(
      readExerciseValues(context, generateStoredValues({ branchId: "77" })),
    ).toEqual({ repetition: 8, weight: 70, weightType: "weightFMax" });
  });

  it("reads an authored absolute weight and a jump height on a box", () => {
    const exercise = generateValueExercise("repetition", {
      withWeights: true,
      isJump: true,
      tags: ["EQ_BOX_LOW"],
      values: {
        weight: {
          startValue: { default: { default: 12 }, type: { type: "weightAbsolute" } },
          targetValue: { default: { default: 20 } },
        },
        height: generateAuthoredValues("30", "50"),
      },
    });

    expect(
      readExerciseValues(
        { intensity: loadIntensityConfig("SWR2"), exercise, ...advancedMan },
        null,
      ),
    ).toEqual({
      repetition: 8,
      weight: 12,
      height: 30,
      weightType: "weightAbsolute",
    });
  });

  it("gives no height to a jump without a box", () => {
    const exercise = generateValueExercise("repetition", {
      isJump: true,
      values: { height: generateAuthoredValues("30", "50") },
    });

    expect(
      readExerciseValues(
        { intensity: loadIntensityConfig("PLYO"), exercise, ...advancedMan },
        null,
      ).height,
    ).toBeUndefined();
  });
});

describe("exerciseValues: intensity start values", () => {
  it.each([
    ["SWR2", "beginner", 67.5],
    ["SWR2", "advanced", 70],
    ["SK", "beginner", 52.5],
    ["SK", "professional", 55],
  ] as const)(
    "%s at level %s starts at %d percent of F-Max",
    (intensityName, level, start) => {
      for (const gender of ["m", "w"] as const) {
        const values = readExerciseValues(
          {
            intensity: loadIntensityConfig(intensityName),
            exercise: generateValueExercise("repetition", { withWeights: true }),
            gender,
            level,
          },
          null,
        );
        expect(values.weight).toBe(start);
        expect(values.weightType).toBe("weightFMax");
      }
    },
  );

  it("starts plyometrics at 4 repetitions", () => {
    expect(
      readExerciseValues(
        {
          intensity: loadIntensityConfig("PLYO"),
          exercise: generateValueExercise("repetition"),
          ...advancedMan,
        },
        null,
        "PLYO_HIGH",
      ).repetition,
    ).toBe(4);
  });

  it("reads the gender default of the intensity before the level default", () => {
    const intensity: IntensityData = {
      ...loadIntensityConfig("SK"),
      startValue: {
        repetition: { default: { default: 3 }, m: { default: 5 } },
      },
    };

    expect(
      readExerciseValues(
        { intensity, exercise: generateValueExercise("repetition"), ...advancedMan },
        null,
      ).repetition,
    ).toBe(5);
  });

  it("reads authored values without an intensity", () => {
    const exercise = generateValueExercise("repetition", {
      values: { repetition: generateAuthoredValues("6", "10") },
    });

    expect(
      readExerciseValues({ intensity: null, exercise, ...advancedMan }, null),
    ).toEqual({ repetition: 6, weightType: "weightAbsolute" });
  });
});

describe("exerciseValues: stored values", () => {
  it.each([
    ["repetition", true, 18, 12],
    ["repetition", false, 5, 8],
    ["duration", true, 70, 50],
    ["duration", false, 70, 60],
    ["duration", false, 20, 30],
  ] as const)(
    "clamps a stored %s with weights %s from %i to %i",
    (mode, withWeights, stored, expected) => {
      const values = readExerciseValues(
        {
          intensity: loadIntensityConfig(withWeights ? "SWR2" : "SWR2KG"),
          exercise: generateValueExercise(mode, { withWeights }),
          ...advancedMan,
        },
        generateStoredValues({ [mode]: stored }),
      );

      expect(values[mode]).toBe(expected);
    },
  );

  const readStoredRepetition = (
    intensityName: string,
    skill: SkillCode,
    repetition: number,
  ) =>
    readExerciseValues(
      {
        intensity: loadIntensityConfig(intensityName),
        exercise: generateValueExercise("repetition", {
          values: { repetition: generateAuthoredValues("4", "8") },
        }),
        ...advancedMan,
      },
      generateStoredValues({ skill, repetition }),
      skill,
    ).repetition;

  it("clamps explosive power repetitions to the authored start and target", () => {
    expect(readStoredRepetition("SK", "SK", 10)).toBe(8);
    expect(readStoredRepetition("SK", "SK", 2)).toBe(4);
  });

  it.each([
    ["DEFAULTKG", "WU"],
    ["DEFAULT", "MAX_STRENGTH"],
    ["DEFAULT", "MAX"],
  ] as const)("keeps stored repetitions of intensity %s for %s", (intensityName, skill) => {
    expect(readStoredRepetition(intensityName, skill, 100)).toBe(100);
  });

  it("keeps a stored load of 0 kg only on a weighted exercise", () => {
    const readWeight = (withWeights: boolean) =>
      readExerciseValues(
        {
          intensity: null,
          exercise: generateValueExercise("repetition", { withWeights }),
          ...advancedMan,
        },
        generateStoredValues({ weight: 0 }),
      ).weight;

    expect(readWeight(true)).toBe(0);
    expect(readWeight(false)).toBeUndefined();
  });

  it("reads the weight type of the intensity for stored values", () => {
    const values = readExerciseValues(
      {
        intensity: loadIntensityConfig("SWR2"),
        exercise: generateValueExercise("repetition", { withWeights: true }),
        ...advancedMan,
      },
      generateStoredValues({ repetition: 10, weight: 72.5 }),
    );

    expect(values).toEqual({
      repetition: 10,
      weight: 72.5,
      weightType: "weightFMax",
    });
  });
});
