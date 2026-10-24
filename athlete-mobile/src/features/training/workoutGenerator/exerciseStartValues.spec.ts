import { generateValueExercise } from "../../../../test/factories/valueExercise";
import { loadExercises } from "@/data/loadExercises";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import type { UserType } from "@/schemas/user.schema";
import {
  type ExerciseStartValueBlock,
  type ExerciseStartValueSource,
  readExerciseStartValues,
} from "./exerciseStartValues";

const LANDING_ID = "1107";

const readCatalogExercise = (id: string): ExerciseType => {
  const exercise = loadExercises().find((entry) => entry.id === id);
  if (!exercise) throw new Error(`Exercise ${id} missing from the catalog`);
  return exercise;
};

/**
 * Builds an athlete with a gender, a birthday and a fitness level.
 *
 * generateAthlete({ birthday: "2018-05-01" })
 * → { userId: "start-values-athlete", personalData: { gender: "MALE", birthday: "2018-05-01" }, ... }
 */
const generateAthlete = ({
  gender = "MALE",
  birthday = "1990-01-01",
  level = "BEGINNER",
}: {
  gender?: "MALE" | "FEMALE";
  birthday?: string;
  level?: string;
} = {}): UserType => ({
  userId: "start-values-athlete",
  personalData: { gender, birthday },
  workoutData: { tags: { LEVEL: [level] }, maxValues: DEFAULT_MAX_VALUES },
  temporalData: [],
});

const generateSource = (
  overrides: Partial<ExerciseStartValueSource> = {},
): ExerciseStartValueSource => ({
  skillCatalog: loadSkillCatalog(),
  athlete: generateAthlete(),
  exerciseData: null,
  ...overrides,
});

const reference = { branchId: "landing", exerciseId: "1", branchTags: [] };

const readStartValues = (
  block: ExerciseStartValueBlock,
  exercise: ExerciseType,
  source = generateSource(),
) =>
  readExerciseStartValues(
    source,
    block,
    { ...reference, exerciseId: exercise.id },
    exercise,
  );

beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-10-24T00:00:00Z") });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("exerciseStartValues: block values mode", () => {
  const landing = readCatalogExercise(LANDING_ID);

  it.each([
    [{ skill: "PREV", values: "exercise" }, 4],
    [{ skill: "PREV", values: "skill" }, 10],
    [{ skill: "PREV" }, 4],
    [{ skill: "PREVKNEE" }, 4],
    [{ skill: "SWR2KG" }, 8],
    [{ skill: "GKS" }, 4],
  ] as const)(
    "starts the landing exercise of block %p at %p repetitions",
    (block, repetition) => {
      expect(readStartValues(block, landing).repetition).toBe(repetition);
    },
  );

  it("gives a block set duration a plain timed set", () => {
    expect(
      readStartValues({ skill: "PREV", setDuration: 45 }, landing),
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
  const exercise = generateValueExercise("duration");

  it("starts a duration exercise at the catalog start duration", () => {
    expect(readStartValues({ skill: "CARDIO_2" }, exercise).duration).toBe(60);
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
        exercise,
        generateSource({ skillCatalog: withStart }),
      ).duration,
    ).toBe(90);
    expect(
      readStartValues(
        { skill: "CARDIO_2" },
        exercise,
        generateSource({ skillCatalog: withoutStart }),
      ).duration,
    ).toBe(30);
  });

  it("raises the catalog start repetitions to the intensity start of the level", () => {
    const athlete = generateAthlete({ level: "ADVANCED" });

    expect(
      readStartValues(
        { skill: "CARDIO_2" },
        generateValueExercise("repetition"),
        generateSource({ athlete }),
      ).repetition,
    ).toBe(4);
  });
});

describe("exerciseStartValues: athlete", () => {
  const exercise = generateValueExercise("repetition", {
    values: {
      repetition: {
        startValue: { default: { default: 6 }, k: { default: 4 }, w: { default: 5 } },
        targetValue: { default: { default: 20 } },
      },
    },
  });

  it.each([
    ["a child", { birthday: "2018-05-01" }, 4],
    ["a woman", { gender: "FEMALE" }, 5],
    ["a man", {}, 6],
  ] as const)("reads the start values of %s", (_title, athleteOptions, expected) => {
    expect(
      readStartValues(
        { skill: "PREV" },
        exercise,
        generateSource({ athlete: generateAthlete(athleteOptions) }),
      ).repetition,
    ).toBe(expected);
  });
});

describe("exerciseStartValues: feedback", () => {
  const exercise = generateValueExercise("repetition");

  /**
   * Builds the stored data of exercise "1" with a feedback.
   *
   * generateExerciseData("SWR2KG", 10)
   * → { "1": { exerciseId: "1", skill: "SWR2KG", repetition: 10, feedback: { difficulty: "SUCCEEDED" } } }
   */
  const generateExerciseData = (
    skill: string,
    repetition: number,
  ): Record<string, UserExerciseDataType> => ({
    "1": {
      exerciseId: "1",
      skill,
      repetition,
      feedback: { difficulty: "SUCCEEDED" },
    },
  });

  it("moves the stored repetitions one step on SUCCEEDED", () => {
    expect(
      readStartValues(
        { skill: "SWR2KG" },
        exercise,
        generateSource({ exerciseData: generateExerciseData("SWR2KG", 10) }),
      ).repetition,
    ).toBe(11);
  });

  it("keeps the stored repetitions of a skill without progression", () => {
    expect(
      readStartValues(
        { skill: "WU" },
        exercise,
        generateSource({ exerciseData: generateExerciseData("WU", 15) }),
      ).repetition,
    ).toBe(15);
  });

  it("starts a stored weight in percent of F-Max one step lower on TOO_HARD", () => {
    const weighted = generateValueExercise("repetition", { withWeights: true });
    const exerciseData: Record<string, UserExerciseDataType> = {
      "1": {
        exerciseId: "1",
        skill: "SWR2",
        repetition: 10,
        weight: 70,
        feedback: { difficulty: "TOO_HARD" },
      },
    };

    const values = readStartValues(
      { skill: "SWR2" },
      weighted,
      generateSource({ exerciseData }),
    );

    expect(values.weight).toBeCloseTo(68.25);
    expect(values.repetition).toBe(10);
    expect(values.weightType).toBe("weightFMax");
  });
});
