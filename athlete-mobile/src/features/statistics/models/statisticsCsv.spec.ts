import i18n from "@/i18n";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import type { UserExerciseDataType } from "@/schemas/sync.schema";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import {
  buildExportFileName,
  toExerciseSetRows,
  toStrengthTestRows,
} from "./statisticsCsv";

const at = (day: number, hour = 8, minute = 5, second = 9): number =>
  new Date(2026, 0, day, hour, minute, second).getTime();

const COLUMN = {
  workoutId: 0,
  date: 1,
  exerciseId: 2,
  exercise: 3,
  skill: 4,
  set: 5,
  setCount: 6,
  repetitions: 7,
  weightKg: 8,
  weightType: 9,
  weightPercentFMax: 10,
  durationSeconds: 11,
  heightCm: 12,
  difficulty: 13,
} as const;

const emptyValue = {
  startValue: { default: {}, m: {}, w: {}, k: {} },
  targetValue: { default: {}, m: {}, w: {}, k: {} },
};

const makeExercise = (
  id: string,
  name: string,
  displayName: string | null,
  tags: string[],
): ExerciseType => ({
  id,
  level: { m: 1, w: 1 },
  name,
  displayName,
  description: "",
  picture: "",
  video: "",
  tags,
  values: {
    duration: emptyValue,
    repetition: emptyValue,
    height: emptyValue,
    weight: emptyValue,
  },
  isAdvanceByReps: false,
  isAdvanceByDuration: false,
  isJump: false,
  conversionFactor: 1,
});

const BENCH_TAGS = ["EQ_BARBELL", "EXERCISE_DIRECTION_HORIZONTAL_PUSH"];
const BENCH = makeExercise("100", "bench_press", "Bench Press", BENCH_TAGS);
const UNNAMED = makeExercise("101", "plain_name", null, BENCH_TAGS);
const DUMBBELL_PRESS = makeExercise("102", "dumbbell_press", "Dumbbell Press", [
  "EQ_DUMBBELL",
  "EQ_BENCH",
]);

const registry: Record<string, ExerciseType> = {
  [BENCH.id]: BENCH,
  [UNNAMED.id]: UNNAMED,
  [DUMBBELL_PRESS.id]: DUMBBELL_PRESS,
};
const getExercise = (id: string): ExerciseType | undefined => registry[id];

const entry = (
  overrides: Partial<UserExerciseDataType> = {},
): UserExerciseDataType => ({
  exerciseId: BENCH.id,
  skill: "SWR1",
  ...overrides,
});

const workout = (
  exercises: UserExerciseDataType[],
  overrides: Partial<CompleteWorkoutType> = {},
): CompleteWorkoutType => ({
  id: "w1",
  timestamp: at(3),
  exercises,
  duration: 1800,
  ...overrides,
});

const pushTest = (
  testAt: number,
  barbell: number | undefined,
): MaxValuesType => ({
  ...DEFAULT_MAX_VALUES,
  testAt,
  horizontalPush: { barbell },
});

describe("statisticsCsv: toExerciseSetRows", () => {
  it("maps all 14 columns of a performed set in spec order", () => {
    const rows = toExerciseSetRows(
      [
        workout(
          [
            entry({
              set: [2, 4],
              repetition: 8,
              weight: 60,
              weightType: "weightAbsolute",
              duration: 45,
              height: 30,
              feedback: { difficulty: "TOO_EASY" },
            }),
          ],
          { id: "w7", timestamp: at(3) },
        ),
      ],
      [],
      i18n.t,
      getExercise,
    );

    expect(rows).toEqual([
      [
        "w7",
        "2026-01-03T08:05:09",
        "100",
        "Bench Press",
        "SWR1",
        2,
        4,
        8,
        60,
        i18n.t("statistics.export.weightType.total"),
        null,
        45,
        30,
        i18n.t("statistics.export.difficulty.tooEasy"),
      ],
    ]);
  });

  describe("weight type", () => {
    const weightTypeOf = (overrides: Partial<UserExerciseDataType>) =>
      toExerciseSetRows(
        [workout([entry(overrides)])],
        [],
        i18n.t,
        getExercise,
      )[0][COLUMN.weightType];

    it("marks the weight of a dumbbell exercise as per dumbbell", () => {
      expect(weightTypeOf({ exerciseId: DUMBBELL_PRESS.id, weight: 22 })).toBe(
        i18n.t("statistics.export.weightType.perDumbbell"),
      );
    });

    it("marks the weight of a barbell exercise as total", () => {
      expect(weightTypeOf({ weight: 60 })).toBe(
        i18n.t("statistics.export.weightType.total"),
      );
    });

    it("marks the weight of an exercise unknown to the registry as total", () => {
      expect(weightTypeOf({ exerciseId: "424242", weight: 12 })).toBe(
        i18n.t("statistics.export.weightType.total"),
      );
    });

    it("gives null without a weight", () => {
      expect(weightTypeOf({ exerciseId: DUMBBELL_PRESS.id })).toBeNull();
    });

    it("gives null when the kg value cannot be derived", () => {
      expect(weightTypeOf({ weight: 50, weightType: "weightFMax" })).toBeNull();
    });
  });

  it("writes one row per performed set across several sets and workouts", () => {
    const rows = toExerciseSetRows(
      [
        workout([entry({ set: [1, 2] }), entry({ set: [2, 2] })], { id: "a" }),
        workout([entry({ set: [1, 1] })], { id: "b", timestamp: at(4) }),
      ],
      [],
      i18n.t,
      getExercise,
    );

    expect(rows.map((row) => row[COLUMN.workoutId])).toEqual(["a", "a", "b"]);
  });

  it("gives no row for a workout without exercise entries", () => {
    expect(toExerciseSetRows([workout([])], [], i18n.t, getExercise)).toEqual(
      [],
    );
  });

  describe("exercise name", () => {
    it("uses the display name when the registry has one", () => {
      const rows = toExerciseSetRows(
        [workout([entry()])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.exercise]).toBe("Bench Press");
    });

    it("falls back to the registry name without a display name", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ exerciseId: UNNAMED.id })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.exercise]).toBe("plain_name");
    });

    it("falls back to the exercise id for an exercise unknown to the registry", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ exerciseId: "424242" })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.exercise]).toBe("424242");
    });

    it("writes the raw exercise id and skill code", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ exerciseId: "424242", skill: "WU" })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0].slice(COLUMN.exerciseId, COLUMN.skill + 1)).toEqual([
        "424242",
        "424242",
        "WU",
      ]);
    });
  });

  describe("performed sets", () => {
    it("drops pause entries", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ exerciseId: PAUSE_EXERCISE_ID }), entry()])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows.map((row) => row[COLUMN.exerciseId])).toEqual(["100"]);
    });

    it("drops skipped entries", () => {
      const rows = toExerciseSetRows(
        [
          workout([
            entry({ skipped: true, set: [1, 2] }),
            entry({ set: [2, 2] }),
          ]),
        ],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows.map((row) => row[COLUMN.set])).toEqual([2]);
    });

    it("drops a skipped entry even when it carries completed true", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ skipped: true, completed: true })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows).toEqual([]);
    });

    it("keeps only completed true entries once one entry carries a completed flag", () => {
      const rows = toExerciseSetRows(
        [
          workout([
            entry({ set: [1, 3], completed: true }),
            entry({ set: [2, 3], completed: false }),
            entry({ set: [3, 3] }),
          ]),
        ],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows.map((row) => row[COLUMN.set])).toEqual([1]);
    });

    it("gives no row when every flagged entry has completed false", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ completed: false }), entry({ completed: false })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows).toEqual([]);
    });

    it("keeps all remaining entries of a workout without any completed flag", () => {
      const rows = toExerciseSetRows(
        [
          workout([
            entry({ set: [1, 3] }),
            entry({ exerciseId: PAUSE_EXERCISE_ID }),
            entry({ set: [2, 3], skipped: true }),
            entry({ set: [3, 3] }),
          ]),
        ],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows.map((row) => row[COLUMN.set])).toEqual([1, 3]);
    });

    it("applies the completed filter per workout", () => {
      const rows = toExerciseSetRows(
        [
          workout([entry({ set: [1, 1], completed: false })], { id: "new" }),
          workout([entry({ set: [1, 1] })], { id: "legacy", timestamp: at(1) }),
        ],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows.map((row) => row[COLUMN.workoutId])).toEqual(["legacy"]);
    });
  });

  describe("null cells", () => {
    it("gives null for set and set count without a set tuple", () => {
      const rows = toExerciseSetRows(
        [workout([entry()])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0].slice(COLUMN.set, COLUMN.setCount + 1)).toEqual([
        null,
        null,
      ]);
    });

    it("gives null for repetitions of 0", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ repetition: 0 })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.repetitions]).toBeNull();
    });

    it("gives null for the strength test marker repetitions of minus 1", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ repetition: -1 })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.repetitions]).toBeNull();
    });

    it("gives null for repetitions, duration, height and difficulty when missing", () => {
      const rows = toExerciseSetRows(
        [workout([entry()])],
        [],
        i18n.t,
        getExercise,
      );

      expect([
        rows[0][COLUMN.repetitions],
        rows[0][COLUMN.durationSeconds],
        rows[0][COLUMN.heightCm],
        rows[0][COLUMN.difficulty],
      ]).toEqual([null, null, null, null]);
    });

    it("gives null for a feedback without a difficulty rating", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ feedback: { difficulty: null } })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.difficulty]).toBeNull();
    });

    it.each([
      ["TOO_EASY", "statistics.export.difficulty.tooEasy"],
      ["TOO_HARD", "statistics.export.difficulty.tooHard"],
      ["SUCCEEDED", "statistics.export.difficulty.succeeded"],
    ] as const)("translates the difficulty %s", (difficulty, key) => {
      const rows = toExerciseSetRows(
        [workout([entry({ feedback: { difficulty } })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.difficulty]).toBe(i18n.t(key));
    });
  });

  describe("weight percent of F-Max", () => {
    it("writes the entry weight for a weightFMax entry", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 75, weightType: "weightFMax" })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightPercentFMax]).toBe(75);
    });

    it("gives null for an absolute weight entry", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 75, weightType: "weightAbsolute" })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightPercentFMax]).toBeNull();
    });

    it("gives null for an entry without a weight type", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 75 })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightPercentFMax]).toBeNull();
    });
  });

  describe("weight in kg", () => {
    it("gives null when the entry has no weight", () => {
      const rows = toExerciseSetRows(
        [workout([entry()])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBeNull();
    });

    it("gives null when the weight is 0", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 0 })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBeNull();
    });

    it("rounds the absolute weight to 2 decimals for an unknown exercise", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ exerciseId: "424242", weight: 12.3004 })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBe(12.3);
    });

    it("gives null for a weightFMax entry of an unknown exercise", () => {
      const rows = toExerciseSetRows(
        [
          workout([
            entry({
              exerciseId: "424242",
              weight: 50,
              weightType: "weightFMax",
            }),
          ]),
        ],
        [pushTest(at(1), 100)],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBeNull();
    });

    it("derives an absolute weight with the equipment rounding of a known exercise", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 21, weightType: "weightAbsolute" })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBe(20);
    });

    it("resolves a weightFMax entry from the strength test before the workout", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 50, weightType: "weightFMax" })])],
        [pushTest(at(1), 100)],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBe(50);
    });

    it("uses the latest strength test at or before each workout", () => {
      const rows = toExerciseSetRows(
        [
          workout([entry({ weight: 50, weightType: "weightFMax" })], {
            id: "early",
            timestamp: at(3),
          }),
          workout([entry({ weight: 50, weightType: "weightFMax" })], {
            id: "late",
            timestamp: at(8),
          }),
        ],
        [pushTest(at(5), 140), pushTest(at(1), 100)],
        i18n.t,
        getExercise,
      );

      expect(rows.map((row) => row[COLUMN.weightKg])).toEqual([50, 70]);
    });

    it("includes a strength test taken at the exact workout timestamp", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 50, weightType: "weightFMax" })])],
        [pushTest(at(3), 140)],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBe(70);
    });

    it("ignores a strength test taken after the workout", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 50, weightType: "weightFMax" })])],
        [pushTest(at(9), 140)],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBeNull();
    });

    it("gives null for a weightFMax entry without any strength test", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 50, weightType: "weightFMax" })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBeNull();
    });

    it("gives null for a weightFMax entry when the tested direction has no barbell value", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 50, weightType: "weightFMax" })])],
        [pushTest(at(1), undefined)],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBeNull();
    });

    it("still resolves an absolute weight without any strength test", () => {
      const rows = toExerciseSetRows(
        [workout([entry({ weight: 60, weightType: "weightAbsolute" })])],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows[0][COLUMN.weightKg]).toBe(60);
    });
  });

  describe("order", () => {
    it("sorts workouts oldest first", () => {
      const rows = toExerciseSetRows(
        [
          workout([entry()], { id: "new", timestamp: at(9) }),
          workout([entry()], { id: "old", timestamp: at(2) }),
        ],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows.map((row) => row[COLUMN.date])).toEqual([
        "2026-01-02T08:05:09",
        "2026-01-09T08:05:09",
      ]);
    });

    it("keeps the stored order of the sets inside a workout", () => {
      const rows = toExerciseSetRows(
        [
          workout([
            entry({ set: [2, 2] }),
            entry({ exerciseId: UNNAMED.id, set: [1, 2] }),
          ]),
        ],
        [],
        i18n.t,
        getExercise,
      );

      expect(rows.map((row) => row[COLUMN.set])).toEqual([2, 1]);
    });

    it("does not mutate the input arrays", () => {
      const workouts = [
        workout([entry()], { id: "new", timestamp: at(9) }),
        workout([entry()], { id: "old", timestamp: at(2) }),
      ];

      toExerciseSetRows(workouts, [], i18n.t, getExercise);

      expect(workouts.map((w) => w.id)).toEqual(["new", "old"]);
    });
  });
});

describe("statisticsCsv: toStrengthTestRows", () => {
  const test = (
    testAt: number,
    barbell: Partial<
      Record<
        | "kneeDominant"
        | "hipHinge"
        | "horizontalPush"
        | "horizontalPull"
        | "verticalPush",
        number
      >
    >,
  ): MaxValuesType => ({
    ...DEFAULT_MAX_VALUES,
    testAt,
    kneeDominant: { barbell: barbell.kneeDominant },
    hipHinge: { barbell: barbell.hipHinge },
    horizontalPush: { barbell: barbell.horizontalPush },
    horizontalPull: { barbell: barbell.horizontalPull },
    verticalPush: { barbell: barbell.verticalPush },
  });

  it("maps squat, deadlift, bench press, rowing, shoulder press", () => {
    const rows = toStrengthTestRows([
      test(at(4), {
        kneeDominant: 100,
        hipHinge: 120,
        horizontalPush: 80,
        horizontalPull: 70,
        verticalPush: 50,
      }),
    ]);

    expect(rows).toEqual([["2026-01-04T08:05:09", 100, 120, 80, 70, 50]]);
  });

  it("rounds barbell values to two decimals", () => {
    const rows = toStrengthTestRows([
      test(at(4), { kneeDominant: 12.300000000000001 }),
    ]);

    expect(rows[0][1]).toBe(12.3);
  });

  it("gives null for a missing barbell value, not 0", () => {
    const rows = toStrengthTestRows([test(at(4), { kneeDominant: 100 })]);

    expect(rows[0]).toEqual([
      "2026-01-04T08:05:09",
      100,
      null,
      null,
      null,
      null,
    ]);
  });

  it("sorts oldest first", () => {
    const rows = toStrengthTestRows([test(at(8), {}), test(at(1), {})]);

    expect(rows.map((row) => row[0])).toEqual([
      "2026-01-01T08:05:09",
      "2026-01-08T08:05:09",
    ]);
  });
});

describe("statisticsCsv: buildExportFileName", () => {
  it("builds the workouts file name", () => {
    expect(buildExportFileName("workouts", "total", new Date(2026, 5, 7))).toBe(
      "workouts_total_2026-06-07.csv",
    );
  });

  it("builds the strength test file name", () => {
    expect(
      buildExportFileName("strength-tests", "week", new Date(2026, 11, 31)),
    ).toBe("strength-tests_week_2026-12-31.csv");
  });
});
