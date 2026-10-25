import { generateCatalogWithProgression } from "@test/factories/skillCatalog";
import { generateStoredExerciseData } from "@test/factories/storedExerciseData";
import {
  findCatalogExerciseById,
  generateAuthoredValues,
  generateValueExercise,
} from "@test/factories/valueExercise";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import { isWeightedExercise, readExerciseValues } from "./exerciseValues";

const advancedMan = { gender: "m", level: "advanced" } as const;

describe("exerciseValues: isWeightedExercise", () => {
  it("reads the weights equipment type", () => {
    expect(
      isWeightedExercise(
        generateValueExercise("repetition", { withWeights: true }),
      ),
    ).toBe(true);
    expect(isWeightedExercise(generateValueExercise("repetition"))).toBe(false);
  });
});

describe("exerciseValues: speed warm-up", () => {
  /**
   * Reads the speed warm-up duration of an advanced man by default.
   *
   * readDuration(findCatalogExerciseById("721"), null)
   * → 30
   */
  const readDuration = (
    exercise: ExerciseType,
    stored: UserExerciseDataType | null,
    athlete: { gender: GenderTag; level: string } = advancedMan,
  ) =>
    readExerciseValues(
      { intensity: loadIntensityConfig("WUSKSA"), exercise, ...athlete },
      stored,
      loadSkillCatalog(),
      "WUSKSA",
    ).duration;

  it("starts ladder 721 at 30 seconds and fast push-ups 433 and 434 at 15", () => {
    expect(readDuration(findCatalogExerciseById("721"), null)).toBe(30);
    expect(readDuration(findCatalogExerciseById("433"), null)).toBe(15);
    expect(readDuration(findCatalogExerciseById("434"), null)).toBe(15);
  });

  it("gives every gender and level the same start duration", () => {
    for (const gender of ["m", "w", "k"] as const) {
      for (const level of ["beginner", "intermediate", "professional"]) {
        expect(
          readDuration(findCatalogExerciseById("721"), null, { gender, level }),
        ).toBe(30);
      }
    }
  });

  it.each([
    ["no authored value", {}, null, 30],
    [
      "an authored 45 to 60",
      { duration: generateAuthoredValues("45", "60") },
      null,
      30,
    ],
    [
      "an authored 20 to 20",
      { duration: generateAuthoredValues("20", "20") },
      null,
      20,
    ],
    ["a stored 50", {}, 50, 30],
  ] as const)("caps %s at 30 seconds", (_title, values, stored, expected) => {
    const exercise = generateValueExercise("duration", { values });

    expect(
      readDuration(
        exercise,
        stored === null
          ? null
          : generateStoredExerciseData({ duration: stored }),
      ),
    ).toBe(expected);
  });
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
          loadSkillCatalog(),
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
    const expected = { repetition: 8, weight: 70, weightType: "weightFMax" };

    expect(readExerciseValues(context, null, loadSkillCatalog())).toEqual(
      expected,
    );
    expect(
      readExerciseValues(
        context,
        generateStoredExerciseData({ branchId: "77" }),
        loadSkillCatalog(),
      ),
    ).toEqual(expected);
  });

  it("reads an authored absolute weight and a jump height on a box", () => {
    const exercise = generateValueExercise("repetition", {
      withWeights: true,
      isJump: true,
      tags: ["EQ_BOX_LOW"],
      values: {
        weight: {
          startValue: {
            default: { default: 12 },
            type: { type: "weightAbsolute" },
          },
          targetValue: { default: { default: 20 } },
        },
        height: generateAuthoredValues("30", "50"),
      },
    });

    expect(
      readExerciseValues(
        { intensity: loadIntensityConfig("SWR2"), exercise, ...advancedMan },
        null,
        loadSkillCatalog(),
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
        loadSkillCatalog(),
      ).height,
    ).toBeUndefined();
  });

  it("reads kilograms for an authored weight without a start entry", () => {
    // The catalog schema requires a start entry, but stored JSON may lack one.
    const exercise = {
      ...generateValueExercise("repetition", { withWeights: true }),
      values: {
        weight: { targetValue: { default: { default: 20 } } },
      },
    } as unknown as ExerciseType;

    expect(
      readExerciseValues(
        { intensity: null, exercise, ...advancedMan },
        generateStoredExerciseData({ weight: 12 }),
        loadSkillCatalog(),
      ),
    ).toEqual({ weight: 12, weightType: "weightAbsolute" });
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
            exercise: generateValueExercise("repetition", {
              withWeights: true,
            }),
            gender,
            level,
          },
          null,
          loadSkillCatalog(),
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
        loadSkillCatalog(),
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
        {
          intensity,
          exercise: generateValueExercise("repetition"),
          ...advancedMan,
        },
        null,
        loadSkillCatalog(),
      ).repetition,
    ).toBe(5);
  });

  it("reads authored values without an intensity", () => {
    const exercise = generateValueExercise("repetition", {
      values: { repetition: generateAuthoredValues("6", "10") },
    });

    expect(
      readExerciseValues(
        { intensity: null, exercise, ...advancedMan },
        null,
        loadSkillCatalog(),
      ),
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
        generateStoredExerciseData({ [mode]: stored }),
        loadSkillCatalog(),
      );

      expect(values[mode]).toBe(expected);
    },
  );

  /**
   * Reads stored repetitions of an exercise authored from 4 up to 8.
   *
   * readStoredRepetition("SK", "SK", 10)
   * → 8
   */
  const readStoredRepetition = (
    intensityName: string,
    skill: string,
    repetition: number,
    skillCatalog: SkillCatalog = loadSkillCatalog(),
  ) =>
    readExerciseValues(
      {
        intensity: loadIntensityConfig(intensityName),
        exercise: generateValueExercise("repetition", {
          values: { repetition: generateAuthoredValues("4", "8") },
        }),
        ...advancedMan,
      },
      generateStoredExerciseData({ skill, repetition }),
      skillCatalog,
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
  ] as const)(
    "keeps stored repetitions of intensity %s for %s",
    (intensityName, skill) => {
      expect(readStoredRepetition(intensityName, skill, 100)).toBe(100);
    },
  );

  it("reads the progression flag of the given catalog", () => {
    expect(
      readStoredRepetition(
        "SK",
        "WU",
        100,
        generateCatalogWithProgression("WU", true),
      ),
    ).toBe(8);
  });

  it("keeps a stored load of 0 kg only on a weighted exercise", () => {
    /**
     * Reads a stored load of 0 kg without an intensity.
     *
     * readWeight(true)
     * → 0
     */
    const readWeight = (withWeights: boolean) =>
      readExerciseValues(
        {
          intensity: null,
          exercise: generateValueExercise("repetition", { withWeights }),
          ...advancedMan,
        },
        generateStoredExerciseData({ weight: 0 }),
        loadSkillCatalog(),
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
      generateStoredExerciseData({ repetition: 10, weight: 72.5 }),
      loadSkillCatalog(),
    );

    expect(values).toEqual({
      repetition: 10,
      weight: 72.5,
      weightType: "weightFMax",
    });
  });
});
