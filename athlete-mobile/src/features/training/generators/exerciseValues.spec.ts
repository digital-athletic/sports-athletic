import {
  importTrees,
  noExerciseData,
  PAUSE_ID,
  realExercises,
} from "../../../../test/factories/planWorkout";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { TrainingType } from "@/features/training/models/Training";
import { getStartValues } from "@/features/training/utils/workoutUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import type { UserType } from "@/schemas/user.schema";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import PlacesData from "../../../../assets/data/generator/places.json";
import type { BlockTiming } from "./resolveTemplate";
import TrainingGenerator from "./TrainingGenerator";

const LANDING_ID = "1107";
const LANDING_START_REPETITION = 4;
const RANGE_START_REPETITION = 10;
const HYPERTROPHY_RANGE_START_REPETITION = 8;

const landing = ExercisesData.find(
  (exercise) => exercise.id === LANDING_ID,
) as ExerciseType;

const user: UserType = {
  userId: "exercise-values-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

const rest = { withinSuperset: 0, betweenSets: 30, afterExercise: 30 };

const workRepetitions = (skill: SkillCode, timing?: BlockTiming) => {
  const entry = {
    branchId: "landing",
    exerciseId: LANDING_ID,
    branchTags: ["SIDE_BOTH"],
  };
  return new TrainingGenerator()
    .getSetListFromExercisePairs(
      [{ first: entry }],
      { skill, length: 30 },
      {},
      user,
      "STUDIO",
      [],
      [landing],
      2,
      [],
      null,
      timing,
    )
    .filter((setEntry) => setEntry.exerciseId === LANDING_ID)
    .map((setEntry) => setEntry.repetition);
};

describe("getSetListFromExercisePairs: block values", () => {
  it("uses the exercise start value for values exercise", () => {
    expect(workRepetitions("PREV", { rest, values: "exercise" })).toEqual([
      LANDING_START_REPETITION,
      LANDING_START_REPETITION,
    ]);
  });

  it("uses the skill range start for values skill", () => {
    expect(workRepetitions("PREV", { rest, values: "skill" })).toEqual([
      RANGE_START_REPETITION,
      RANGE_START_REPETITION,
    ]);
  });

  it("lets the intensity config decide when values is omitted", () => {
    expect(workRepetitions("PREV", { rest })).toEqual([
      LANDING_START_REPETITION,
      LANDING_START_REPETITION,
    ]);
  });

  it("uses the exercise start value in a plan workout without timing", () => {
    expect(workRepetitions("PREVKNEE")).toEqual([
      LANDING_START_REPETITION,
      LANDING_START_REPETITION,
    ]);
  });

  it("keeps the skill range start of a skill that overrides exercise values", () => {
    expect(workRepetitions("SWR2KG")).toEqual([
      HYPERTROPHY_RANGE_START_REPETITION,
      HYPERTROPHY_RANGE_START_REPETITION,
    ]);
  });

  it("uses the exercise start value for full body stability in a plan workout", () => {
    expect(workRepetitions("GKS")).toEqual([
      LANDING_START_REPETITION,
      LANDING_START_REPETITION,
    ]);
  });
});

describe("exerciseValues: bundled templates", () => {
  const PREVENTION_TEMPLATES: TrainingType[] = [
    "PREV",
    "PREVSHOULDER",
    "PREVKNEE",
    "PREVWRIST",
    "PREVANKLE",
    "PREVSPINE",
  ];
  const RANGE_START = {
    PREV: { repetition: 10, duration: 40 },
    GKS: { repetition: 8, duration: 30 },
  };
  const skillTrees = importTrees(
    "WU",
    "MOB",
    "BR",
    "CD",
    "BAS",
    "GKS",
    "GKSKG",
    "PREV",
    "PREVKG",
    "WUSPEZIAL",
  );
  const exerciseById = new Map(
    realExercises.map((exercise) => [exercise.id, exercise]),
  );
  const adult: UserType = {
    ...user,
    workoutData: {
      tags: { LEVEL: ["BEGINNER"], PAIN: [] },
      maxValues: DEFAULT_MAX_VALUES,
    },
  };

  const workEntries = (
    template: TrainingType,
    skillPrefix: string,
  ): GeneratedSetListEntry[] =>
    new TrainingGenerator()
      .generateTraining(
        template,
        adult,
        "STUDIO",
        realExercises,
        skillTrees,
        1,
        PlacesData.STUDIO.EQUIPMENT,
        undefined,
        0,
        noExerciseData,
      )
      .filter(
        (entry) =>
          entry.exerciseId !== PAUSE_ID && entry.skill.startsWith(skillPrefix),
      );

  const authoredStart = (
    entry: GeneratedSetListEntry,
  ): { repetition?: number; duration?: number } => {
    const exercise = exerciseById.get(entry.exerciseId);
    if (!exercise?.values) return {};
    const start = getStartValues(exercise.values, "m", "beginner");
    return {
      repetition: exercise.isAdvanceByReps ? start.repetition : undefined,
      duration: exercise.isAdvanceByDuration ? start.duration : undefined,
    };
  };

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it.each([
    ["PREV", PREVENTION_TEMPLATES],
    ["GKS", ["GKS"] as TrainingType[]],
  ] as const)(
    "%s: gives a work entry other than the skill range start",
    (prefix, templates) => {
      const range = RANGE_START[prefix];
      const entries = templates.flatMap((template) =>
        workEntries(template, prefix),
      );
      expect(
        entries.some(
          (entry) =>
            (entry.repetition !== undefined &&
              entry.repetition !== range.repetition) ||
            (entry.duration !== undefined && entry.duration !== range.duration),
        ),
      ).toBe(true);
    },
  );

  it.each([
    ["PREV", PREVENTION_TEMPLATES],
    ["GKS", ["GKS"] as TrainingType[]],
  ] as const)(
    "%s: gives each work entry the authored start value of its exercise",
    (prefix, templates) => {
      let checked = 0;
      for (const template of templates) {
        for (const entry of workEntries(template, prefix)) {
          const start = authoredStart(entry);
          if (start.repetition !== undefined) {
            expect(entry.repetition).toBe(start.repetition);
            checked += 1;
          }
          if (start.duration !== undefined) {
            expect(entry.duration).toBe(start.duration);
            checked += 1;
          }
        }
      }
      expect(checked).toBeGreaterThan(0);
    },
  );
});
