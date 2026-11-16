import type {
  ExerciseType,
  ExerciseValuesType,
} from "@/schemas/exercise.schema";
import type { MaxValuesType } from "../models/MaxValues";
import { DEFAULT_MAX_VALUES } from "../models/MaxValues";
import type { UserExerciseDataType } from "../models/UserExerciseData";
import { useTrainingStore } from "../trainingStore";
import { calculateMovedWeight } from "./workoutUtils";

const emptyValue: ExerciseValuesType = {
  startValue: { default: {}, m: {}, w: {}, k: {} },
  targetValue: { default: {}, m: {}, w: {}, k: {} },
};

// generateCatalogExercise("1", ["EQ_DUMBBELL"]) gives catalog exercise "1" with that equipment tag
const generateCatalogExercise = (id: string, tags: string[]): ExerciseType => ({
  id,
  level: { m: 1, w: 1 },
  name: `Exercise ${id}`,
  displayName: `Exercise ${id}`,
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
});

// generateSetEntry("1", [2, 4], [20, 10]) gives open 2nd of 4 sets, [load, reps] 20 kg for 10 reps; overrides add flags
const generateSetEntry = (
  exerciseId: string,
  set: [number, number],
  [weight, repetition]: [number | undefined, number | undefined],
  overrides: Partial<UserExerciseDataType> = {},
): UserExerciseDataType => ({
  exerciseId,
  set,
  weight,
  repetition,
  weightType: "weightAbsolute",
  skill: "SKSTR",
  ...overrides,
});

// generateWarmupLadder("1", [DONE, DONE, OPEN, OPEN]) gives sets of 14, 20, 20, 20 kg at 10 reps for exercise "1", one flag object per set
const generateWarmupLadder = (
  exerciseId: string,
  flagsPerSet: Partial<UserExerciseDataType>[],
): UserExerciseDataType[] =>
  [14, 20, 20, 20].map((weight, index) =>
    generateSetEntry(
      exerciseId,
      [index + 1, 4],
      [weight, 10],
      flagsPerSet[index],
    ),
  );

const DONE = { completed: true };
const SKIPPED = { completed: true, skipped: true };
const OPEN = {};

const plainExercise = generateCatalogExercise("1", []);

describe("calculateMovedWeight: done sets", () => {
  afterEach(() => {
    useTrainingStore.setState({ exerciseList: null });
  });

  it("returns 740 when all four sets of the warm up ladder are done", () => {
    const exerciseList = generateWarmupLadder("1", [DONE, DONE, DONE, DONE]);

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(740);
  });

  it("returns 340 when only the first two sets are done", () => {
    const exerciseList = generateWarmupLadder("1", [DONE, DONE, OPEN, OPEN]);

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(340);
  });

  it("counts a skipped set that was retaken and finished", () => {
    const store = useTrainingStore.getState();
    store.setExerciseList(generateWarmupLadder("1", [OPEN, OPEN, OPEN, OPEN]));
    [0, 1, 3].forEach((index) => store.markExerciseCompleted(index));
    store.markExerciseSkipped(2);
    store.markExerciseCompleted(2);
    store.reopenSkippedSets([2]);
    store.markExerciseCompleted(2);

    const result = calculateMovedWeight(
      useTrainingStore.getState().exerciseList ?? [],
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(740);
  });

  it("returns 540 when the third of four sets is skipped", () => {
    const exerciseList = generateWarmupLadder("1", [DONE, DONE, SKIPPED, DONE]);

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(540);
  });

  it("returns 1215 for a ladder of 30, 45, 60, 70 and 80 kg at 8, 5, 5, 3 and 3 reps", () => {
    const loads = [30, 45, 60, 70, 80];
    const repetitions = [8, 5, 5, 3, 3];
    const exerciseList = loads.map((load, index) =>
      generateSetEntry("1", [index + 1, 5], [load, repetitions[index]], DONE),
    );

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(1215);
  });

  it("counts a dumbbell load once as stored", () => {
    const dumbbellExercise = generateCatalogExercise("2", ["EQ_DUMBBELL"]);
    const exerciseList = [generateSetEntry("2", [1, 1], [8, 10], DONE)];

    const result = calculateMovedWeight(
      exerciseList,
      [dumbbellExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(80);
  });
});

describe("calculateMovedWeight: sets that add nothing", () => {
  it("returns 0 when all sets are skipped", () => {
    const exerciseList = generateWarmupLadder("1", [
      SKIPPED,
      SKIPPED,
      SKIPPED,
      SKIPPED,
    ]);

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(0);
  });

  it("returns 0 when no set is done", () => {
    const exerciseList = generateWarmupLadder("1", [OPEN, OPEN, OPEN, OPEN]);

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(0);
  });

  it("returns 0 for a done rest entry", () => {
    const exerciseList = [
      generateSetEntry("999999", [1, 1], [20, 10], { completed: true }),
    ];

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(0);
  });

  it("returns 0 for a done strength test set with skill TEST", () => {
    const exerciseList = [
      generateSetEntry("1", [1, 1], [60, 3], { ...DONE, skill: "TEST" }),
    ];

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(0);
  });

  it("returns 0 for a done strength test set with repetition -1", () => {
    const exerciseList = [generateSetEntry("1", [1, 1], [60, -1], DONE)];

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(0);
  });

  it("returns 0 for a done bodyweight set without weight", () => {
    const exerciseList = [generateSetEntry("1", [1, 1], [undefined, 12], DONE)];

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(0);
  });

  it("returns 0 for a done set without repetitions", () => {
    const exerciseList = [generateSetEntry("1", [1, 1], [20, undefined], DONE)];

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(0);
  });

  it("returns 0 for a done set of an exercise missing in the catalog", () => {
    const exerciseList = [generateSetEntry("404", [1, 1], [20, 10], DONE)];

    const result = calculateMovedWeight(
      exerciseList,
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(0);
  });

  it("returns 0 for an empty exercise list", () => {
    const result = calculateMovedWeight(
      [],
      [plainExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(0);
  });
});

describe("calculateMovedWeight: percentage weights", () => {
  const pushExercise = generateCatalogExercise("3", [
    "EXERCISE_DIRECTION_VERTICAL_PUSH",
  ]);

  it("returns 0 for a done percentage set without a strength test max", () => {
    const exerciseList = [
      generateSetEntry("3", [1, 1], [50, 5], {
        ...DONE,
        weightType: "weightFMax",
      }),
    ];

    const result = calculateMovedWeight(
      exerciseList,
      [pushExercise],
      DEFAULT_MAX_VALUES,
    );

    expect(result).toBe(0);
  });

  it("counts the derived load of a done percentage set with a strength test max", () => {
    const maxValues: MaxValuesType = {
      ...DEFAULT_MAX_VALUES,
      verticalPush: {
        ...DEFAULT_MAX_VALUES.verticalPush,
        barbell: 100,
      },
    };
    const exerciseList = [
      generateSetEntry("3", [1, 1], [50, 5], {
        ...DONE,
        weightType: "weightFMax",
      }),
    ];

    const result = calculateMovedWeight(
      exerciseList,
      [pushExercise],
      maxValues,
    );

    // 50 percent of 100 kg is 50 kg, times 5 repetitions
    expect(result).toBe(250);
  });
});
