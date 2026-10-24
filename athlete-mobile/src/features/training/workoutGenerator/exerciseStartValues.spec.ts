import {
  findCatalogExerciseById,
  generateValueExercise,
} from "../../../../test/factories/valueExercise";
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

/**
 * Builds the inputs start values read: the bundled catalog, an adult male
 * beginner and no exercise data unless overridden.
 *
 * generateSource({ exerciseData: { "1": { ... } } })
 * → { skillCatalog: <bundled>, athlete: { userId: "start-values-athlete", ... }, exerciseData: { "1": { ... } } }
 */
const generateSource = (
  overrides: Partial<ExerciseStartValueSource> = {},
): ExerciseStartValueSource => ({
  skillCatalog: loadSkillCatalog(),
  athlete: generateAthlete(),
  exerciseData: null,
  ...overrides,
});

/**
 * Reads the start values of an exercise in branch "landing".
 *
 * readStartValues({ skill: "PREV" }, findCatalogExerciseById("1107"))
 * → { tags: [], exerciseId: "1107", branchId: "landing", repetition: 4, ... }
 */
const readStartValues = (
  block: ExerciseStartValueBlock,
  exercise: ExerciseType,
  source = generateSource(),
) =>
  readExerciseStartValues(
    source,
    block,
    { branchId: "landing", exerciseId: exercise.id, branchTags: [] },
    exercise,
  );

/**
 * Builds the stored data of exercise "1" with a SUCCEEDED feedback.
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
        generateSource({ skillCatalog: withStart }),
      ).duration,
    ).toBe(90);
    expect(
      readStartValues(
        { skill: "CARDIO_2" },
        generateValueExercise("duration"),
        generateSource({ skillCatalog: withoutStart }),
      ).duration,
    ).toBe(30);
  });

  it("raises the catalog start repetitions to the intensity start of the level", () => {
    expect(
      readStartValues(
        { skill: "CARDIO_2" },
        generateValueExercise("repetition"),
        generateSource({ athlete: generateAthlete({ level: "ADVANCED" }) }),
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
          generateSource({ athlete: generateAthlete(athleteOptions) }),
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
        generateSource({ exerciseData: generateExerciseData("SWR2KG", 10) }),
      ).repetition,
    ).toBe(11);
  });

  it("keeps the stored repetitions of a skill without progression", () => {
    expect(
      readStartValues(
        { skill: "WU" },
        generateValueExercise("repetition"),
        generateSource({ exerciseData: generateExerciseData("WU", 15) }),
      ).repetition,
    ).toBe(15);
  });

  it("reads the progression flag of the given catalog", () => {
    const skillCatalog = loadSkillCatalog();
    const withProgression: SkillCatalog = {
      ...skillCatalog,
      WU: { ...skillCatalog.WU, progression: true },
    };

    expect(
      readStartValues(
        { skill: "WU" },
        generateValueExercise("repetition"),
        generateSource({
          skillCatalog: withProgression,
          exerciseData: generateExerciseData("WU", 15),
        }),
      ).repetition,
    ).toBe(16);
  });

  it("starts a stored weight in percent of F-Max one step lower on TOO_HARD", () => {
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
      generateValueExercise("repetition", { withWeights: true }),
      generateSource({ exerciseData }),
    );

    expect(values.weight).toBeCloseTo(68.25);
    expect(values.repetition).toBe(10);
    expect(values.weightType).toBe("weightFMax");
  });
});
