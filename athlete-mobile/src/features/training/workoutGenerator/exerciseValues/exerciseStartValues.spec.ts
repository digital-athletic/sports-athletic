import { generateAthleteWithMaxValues } from "@test/factories/athlete";
import { generateExerciseStartValueSource } from "@test/factories/exerciseStartValueSource";
import { generateCatalogWithProgression } from "@test/factories/skillCatalog";
import {
  generateExerciseProgressMap,
  generateFeedbackExerciseData,
  generateStoredExerciseData,
} from "@test/factories/storedExerciseData";
import { generateAuthoredUnitExercise } from "@test/factories/weightIntensity";
import {
  findCatalogExerciseById,
  generateValueExercise,
} from "@test/factories/valueExercise";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import {
  type ExerciseStartValueBlock,
  readExerciseStartValues,
} from "./exerciseStartValues";

const LANDING_ID = "1107";

/**
 * Reads the start values of an exercise in branch "landing".
 *
 * readStartValues({ skill: "PREV" }, findCatalogExerciseById("1107"))
 * → { tags: [], exerciseId: "1107", branchId: "landing", repetition: 4, ... }
 */
const readStartValues = (
  block: ExerciseStartValueBlock,
  exercise: ExerciseType,
  source = generateExerciseStartValueSource(),
) =>
  readExerciseStartValues(
    source,
    block,
    { branchId: "landing", exerciseId: exercise.id, branchTags: [] },
    exercise,
  );

beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-10-24T00:00:00Z") });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("exerciseStartValues: block values mode", () => {
  it.each([
    [{ skill: "PREV", values: "exercise" }, 4],
    [{ skill: "PREV", values: "skill" }, 10],
    [{ skill: "PREV" }, 4],
    [{ skill: "PREVKNEE" }, 4],
    [{ skill: "SWR2KG" }, 8],
    [{ skill: "GKS" }, 4],
  ] as const)(
    "starts the landing exercise of block %o at %p repetitions",
    (block, repetition) => {
      expect(
        readStartValues(block, findCatalogExerciseById(LANDING_ID)).repetition,
      ).toBe(repetition);
    },
  );

  it("gives a block set duration a plain timed set", () => {
    expect(
      readStartValues(
        { skill: "PREV", setDuration: 45 },
        findCatalogExerciseById(LANDING_ID),
      ),
    ).toEqual({
      tags: [],
      exerciseId: LANDING_ID,
      branchId: "landing",
      duration: 45,
      height: undefined,
      repetition: undefined,
      weight: undefined,
      weightType: "weightAbsolute",
    });
  });
});

describe("exerciseStartValues: catalog start values", () => {
  it("starts a duration exercise at the catalog start duration", () => {
    expect(
      readStartValues({ skill: "CARDIO_2" }, generateValueExercise("duration"))
        .duration,
    ).toBe(60);
  });

  it("reads the start duration from the given catalog, else 30 seconds", () => {
    const skillCatalog = loadSkillCatalog();
    const withStart: SkillCatalog = {
      ...skillCatalog,
      CARDIO_2: { ...skillCatalog.CARDIO_2, startDuration: 90 },
    };
    const withoutStart: SkillCatalog = {
      ...skillCatalog,
      CARDIO_2: { ...skillCatalog.CARDIO_2, startDuration: undefined },
    };

    expect(
      readStartValues(
        { skill: "CARDIO_2" },
        generateValueExercise("duration"),
        generateExerciseStartValueSource({ skillCatalog: withStart }),
      ).duration,
    ).toBe(90);
    expect(
      readStartValues(
        { skill: "CARDIO_2" },
        generateValueExercise("duration"),
        generateExerciseStartValueSource({ skillCatalog: withoutStart }),
      ).duration,
    ).toBe(30);
  });

  it("raises the catalog start repetitions to the intensity start of the level", () => {
    expect(
      readStartValues(
        { skill: "CARDIO_2" },
        generateValueExercise("repetition"),
        generateExerciseStartValueSource({
          athlete: generateAthleteWithMaxValues({ level: "ADVANCED" }),
        }),
      ).repetition,
    ).toBe(4);
  });
});

describe("exerciseStartValues: athlete", () => {
  it.each([
    ["a child", { birthday: "2018-05-01" }, 4],
    ["a woman", { gender: "FEMALE" }, 5],
    ["a man", {}, 6],
  ] as const)(
    "reads the start values of %s",
    (_title, athleteOptions, expected) => {
      const exercise = generateValueExercise("repetition", {
        values: {
          repetition: {
            startValue: {
              default: { default: 6 },
              k: { default: 4 },
              w: { default: 5 },
            },
            targetValue: { default: { default: 20 } },
          },
        },
      });

      expect(
        readStartValues(
          { skill: "PREV" },
          exercise,
          generateExerciseStartValueSource({
            athlete: generateAthleteWithMaxValues(athleteOptions),
          }),
        ).repetition,
      ).toBe(expected);
    },
  );
});

describe("exerciseStartValues: feedback", () => {
  it("moves the stored repetitions one step on SUCCEEDED", () => {
    expect(
      readStartValues(
        { skill: "SWR2KG" },
        generateValueExercise("repetition"),
        generateExerciseStartValueSource({
          exerciseData: generateExerciseProgressMap(
            generateFeedbackExerciseData({ skill: "SWR2KG", repetition: 10 }),
          ),
        }),
      ).repetition,
    ).toBe(11);
  });

  it("keeps the stored repetitions of a skill without progression", () => {
    expect(
      readStartValues(
        { skill: "WU" },
        generateValueExercise("repetition"),
        generateExerciseStartValueSource({
          exerciseData: generateExerciseProgressMap(
            generateFeedbackExerciseData({ skill: "WU", repetition: 15 }),
          ),
        }),
      ).repetition,
    ).toBe(15);
  });

  it("reads the progression flag of the given catalog", () => {
    expect(
      readStartValues(
        { skill: "WU" },
        generateValueExercise("repetition"),
        generateExerciseStartValueSource({
          skillCatalog: generateCatalogWithProgression("WU", true),
          exerciseData: generateExerciseProgressMap(
            generateFeedbackExerciseData({ skill: "WU", repetition: 15 }),
          ),
        }),
      ).repetition,
    ).toBe(16);
  });

  it("starts a stored weight in percent of F-Max one step lower on TOO_HARD", () => {
    const exerciseData = generateExerciseProgressMap(
      generateFeedbackExerciseData({ repetition: 10, weight: 70 }, "TOO_HARD"),
    );

    const values = readStartValues(
      { skill: "SWR2" },
      generateValueExercise("repetition", { withWeights: true }),
      generateExerciseStartValueSource({ exerciseData }),
    );

    expect(values.weight).toBeCloseTo(68.25);
    expect(values.repetition).toBe(10);
    expect(values.weightType).toBe("weightFMax");
  });
});

describe("exerciseStartValues: progress per skill", () => {
  it("starts a block at the record of its own skill and ignores another skill's record of the exercise", () => {
    const values = readStartValues(
      { skill: "SWR2" },
      generateAuthoredUnitExercise("weightAbsolute"),
      generateExerciseStartValueSource({
        exerciseData: generateExerciseProgressMap(
          generateStoredExerciseData({
            skill: "SWR2",
            weight: 50,
            weightType: "weightAbsolute",
            repetition: 12,
            updatedAt: 100,
          }),
          generateStoredExerciseData({
            skill: "SWR1",
            weight: 30,
            weightType: "weightAbsolute",
            repetition: 20,
            updatedAt: 200,
          }),
        ),
      }),
    );

    expect(values.weight).toBe(50);
    expect(values.repetition).toBe(12);
  });

  it("starts a new skill at the weight of another skill's record and the catalog start repetitions", () => {
    const exercise = generateAuthoredUnitExercise("weightAbsolute");
    const startRepetition = readStartValues(
      { skill: "SWR2" },
      exercise,
    ).repetition;

    const values = readStartValues(
      { skill: "SWR2" },
      exercise,
      generateExerciseStartValueSource({
        exerciseData: generateExerciseProgressMap(
          generateStoredExerciseData({
            skill: "SWR1",
            weight: 40,
            weightType: "weightAbsolute",
            repetition: 17,
            feedback: { difficulty: "TOO_EASY" },
          }),
        ),
      }),
    );

    expect(values.weight).toBe(40);
    expect(values.weightType).toBe("weightAbsolute");
    expect(values.repetition).toBe(startRepetition);
  });
});
