import { getExerciseById } from "@/data/exerciseRegistry";
import {
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "@/features/training/models/MaxValues";
import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE as BASELINE,
  createExercise,
  createExerciseData,
} from "@/features/training/utils/testFixtures";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { renderHook } from "@testing-library/react-native";
import { useTrainingListRows } from "./useTrainingListRows";

jest.mock("@/data/exerciseRegistry", () => ({
  getExerciseById: jest.fn(),
}));

jest.mock("react-i18next", () => {
  type MockOptions = Record<string, unknown> | undefined;
  const translations: Record<string, (options: MockOptions) => string> = {
    "training.active.set": (o) => `${o?.current} of ${o?.total}`,
    "training.overview.repetitions": (o) => `${o?.count} repetitions`,
    "training.overview.seconds": (o) => `${o?.count} seconds`,
    "training.overview.kilos": (o) => `${o?.weight} kg`,
    "training.active.2x": () => "each ",
    "training.list.setKilos": (o) => `${o?.weight} kg`,
    "training.list.setSeconds": (o) => `${o?.count} s`,
    "training.list.setReps": (o) => `${o?.count} reps`,
  };
  return {
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) =>
        translations[key]?.(options) ?? key,
    }),
  };
});

const mockGetExerciseById = getExerciseById as jest.Mock;

const BARBELL_HIP_TAGS = [
  "EQ_BARBELL",
  "EQ_TYPE_WEIGHTS",
  "EXERCISE_DIRECTION_HIP",
];

const seedMaxValues = (overrides: Partial<MaxValuesType> = {}) => {
  useUserWorkoutStore.setState({
    workoutData: {
      sport: "OTHER_SPORT",
      tags: { POSITION: ["FIELD"], LEVEL: ["BEGINNER"] },
      seasonPhase: { type: null, endDate: "2026-01-01" },
      maxValues: { ...DEFAULT_MAX_VALUES, ...overrides },
    },
  });
};

describe("useTrainingListRows: subtitle composition", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    seedMaxValues();
  });

  afterEach(() => {
    mockGetExerciseById.mockReset();
  });

  it("joins set, reps, and absolute weight into one subtitle", async () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: [] }),
    );
    useTrainingStore.setState({
      exerciseList: [
        createExercise({
          exerciseId: "1",
          set: [1, 3],
          repetition: 10,
          weight: 20,
        }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBe(
      "1 of 3 · 10 repetitions · 20.00 kg",
    );
  });

  it("prefixes the weight with the dumbbell each-hand qualifier", async () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: ["EQ_DUMBBELL"] }),
    );
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", weight: 20 })],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBe("each 20.00 kg");
  });

  it("derives weight as a percentage of the user's max for weightFMax", async () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: BARBELL_HIP_TAGS }),
    );
    seedMaxValues({ hipHinge: { barbell: 80 } });
    useTrainingStore.setState({
      exerciseList: [
        createExercise({
          exerciseId: "1",
          weight: 50,
          weightType: "weightFMax",
        }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBe("40.00 kg");
  });

  it("keeps a strength test barbell load below the empty bar", async () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: BARBELL_HIP_TAGS }),
    );
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", skill: "TEST", weight: 12.5 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBe("12.50 kg");
  });

  it("raises a training barbell load below the empty bar to 20 kg", async () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: BARBELL_HIP_TAGS }),
    );
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", weight: 12.5 })],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBe("20.00 kg");
  });

  it("omits the reps segment for strength-test rows", async () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: [] }),
    );
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", repetition: -1, weight: 20 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBe("20.00 kg");
  });

  it("leaves the subtitle undefined when there is no set, reps, or weight info", async () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: [] }),
    );
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1" })],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBeUndefined();
  });
});

describe("useTrainingListRows: next set preview label", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    seedMaxValues();
  });

  afterEach(() => {
    mockGetExerciseById.mockReset();
  });

  it("shows set number and repetitions", async () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: [] }),
    );
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", set: [2, 3], repetition: 10 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].nextSetLabel).toBe("2 of 3 · 10 repetitions");
  });

  it("shows the duration when the set has no repetitions", async () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: [] }),
    );
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", set: [1, 2], duration: 30 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].nextSetLabel).toBe("1 of 2 · 30 seconds");
    expect(result.current.rows[0].setLabel).toBe("1 of 2");
  });

  it("prefixes the weight of a dumbbell exercise", async () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: ["EQ_DUMBBELL"] }),
    );
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", repetition: 8, weight: 20 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].nextSetLabel).toBe(
      "8 repetitions · each 20.00 kg",
    );
  });
});

describe("useTrainingListRows: all rows completed", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    seedMaxValues();
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: [] }),
    );
  });

  afterEach(() => {
    mockGetExerciseById.mockReset();
  });

  it("ignores an open rest when every set is completed", async () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", completed: true }),
        createExercise({ exerciseId: "999999", duration: 60 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.allCompleted).toBe(true);
  });

  it("stays false while a set is open", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1" })],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.allCompleted).toBe(false);
  });
});

// One set of an exercise, e.g. generateSetEntry("1", 2, 3, { weight: 22.5 })
// is { exerciseId: "1", set: [2, 3], weight: 22.5 }.
const generateSetEntry = (
  exerciseId: string,
  current: number,
  total: number,
  overrides: Partial<UserExerciseDataType> = {},
): UserExerciseDataType =>
  createExercise({ exerciseId, set: [current, total], ...overrides });

// A rest between sets, e.g. { exerciseId: "999999" }.
const generateRestEntry = (): UserExerciseDataType =>
  createExercise({ exerciseId: PAUSE_EXERCISE_ID });

describe("useTrainingListRows: one entry per exercise", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    seedMaxValues();
    mockGetExerciseById.mockImplementation((id: string) =>
      createExerciseData({ id, displayName: `Exercise ${id}`, tags: [] }),
    );
  });

  afterEach(() => {
    mockGetExerciseById.mockReset();
  });

  it("returns one entry for an exercise with several sets and a warm up set", async () => {
    // The warm up is set 1 of 4, the work sets are 2 to 4 of 4.
    useTrainingStore.setState({
      exerciseList: [
        generateSetEntry("1", 1, 4),
        generateRestEntry(),
        generateSetEntry("1", 2, 4),
        generateRestEntry(),
        generateSetEntry("1", 3, 4),
        generateRestEntry(),
        generateSetEntry("1", 4, 4),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks).toHaveLength(1);
    expect(result.current.blocks[0].entries).toHaveLength(1);
    expect(result.current.blocks[0].entries[0].sets).toHaveLength(4);
  });

  it("keys the entry by its first set and names it after the exercise", async () => {
    useTrainingStore.setState({
      exerciseList: [
        generateRestEntry(),
        generateSetEntry("7", 1, 1, { repetition: 10 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    const entry = result.current.blocks[0].entries[0];
    expect(entry.key).toBe(1);
    expect(entry.exerciseId).toBe("7");
    expect(entry.displayName).toBe("Exercise 7");
  });

  it("labels weighted sets with the weight and drops trailing zeros", async () => {
    useTrainingStore.setState({
      exerciseList: [
        generateSetEntry("1", 1, 2, { weight: 20, repetition: 10 }),
        generateSetEntry("1", 2, 2, { weight: 40, repetition: 10 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].entries[0].sets.map((s) => s.label)).toEqual(
      ["20 kg", "40 kg"],
    );
  });

  it("keeps the fraction of a weight that the rounding leaves", async () => {
    // A strength test keeps a barbell load below the empty bar, here 12.5 kg.
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: BARBELL_HIP_TAGS }),
    );
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", skill: "TEST", weight: 12.5 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].entries[0].sets[0].label).toBe("12.5 kg");
  });

  it("labels timed sets with the duration in seconds", async () => {
    useTrainingStore.setState({
      exerciseList: [
        generateSetEntry("1", 1, 2, { duration: 20 }),
        generateSetEntry("1", 2, 2, { duration: 25 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].entries[0].sets.map((s) => s.label)).toEqual(
      ["20 s", "25 s"],
    );
  });

  it("labels the sets of an endurance skill with the repetitions", async () => {
    useTrainingStore.setState({
      exerciseList: [
        generateSetEntry("1", 1, 1, {
          skill: "CARDIO_4",
          duration: 600,
          repetition: 1,
        }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].entries[0].sets[0].label).toBe("1 reps");
  });

  it("labels other sets with the repetitions", async () => {
    useTrainingStore.setState({
      exerciseList: [
        generateSetEntry("1", 1, 2, { repetition: 10 }),
        generateSetEntry("1", 2, 2, { repetition: 12 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].entries[0].sets.map((s) => s.label)).toEqual(
      ["10 reps", "12 reps"],
    );
  });

  it("gives a strength test set no label and marks the entry as a test", async () => {
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", repetition: -1 })],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    const entry = result.current.blocks[0].entries[0];
    expect(entry.isTest).toBe(true);
    expect(entry.sets[0].label).toBeUndefined();
  });

  it("labels weight before duration for a timed set with weight", async () => {
    useTrainingStore.setState({
      exerciseList: [generateSetEntry("1", 1, 1, { weight: 20, duration: 30 })],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].entries[0].sets[0].label).toBe("20 kg");
  });

  it("labels a set with weight 0 by its repetitions", async () => {
    useTrainingStore.setState({
      exerciseList: [generateSetEntry("1", 1, 1, { weight: 0, repetition: 8 })],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].entries[0].sets[0].label).toBe("8 reps");
  });

  it("marks each set completed or open", async () => {
    useTrainingStore.setState({
      exerciseList: [
        generateSetEntry("1", 1, 3, { completed: true, repetition: 10 }),
        generateRestEntry(),
        generateSetEntry("1", 2, 3, { repetition: 10 }),
        generateRestEntry(),
        generateSetEntry("1", 3, 3, { repetition: 10 }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(
      result.current.blocks[0].entries[0].sets.map((s) => [s.index, s.completed]),
    ).toEqual([
      [0, true],
      [2, false],
      [4, false],
    ]);
  });

  it("reports the first open set index of the entry", async () => {
    useTrainingStore.setState({
      exerciseList: [
        generateSetEntry("1", 1, 2, { completed: true }),
        generateRestEntry(),
        generateSetEntry("1", 2, 2),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].entries[0].firstOpenSetIndex).toBe(2);
  });

  it("completes the entry only when all its sets are completed", async () => {
    useTrainingStore.setState({
      exerciseList: [
        generateSetEntry("1", 1, 2, { completed: true }),
        generateSetEntry("1", 2, 2),
        generateSetEntry("2", 1, 1, { completed: true }),
      ],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks.map((b) => b.entries[0].completed)).toEqual([
      false,
      true,
    ]);
  });

  it("gives a completed entry no first open set", async () => {
    useTrainingStore.setState({
      exerciseList: [generateSetEntry("1", 1, 1, { completed: true })],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].entries[0].firstOpenSetIndex).toBeNull();
  });
});

describe("useTrainingListRows: superset blocks", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    seedMaxValues();
    mockGetExerciseById.mockImplementation((id: string) =>
      createExerciseData({ id, displayName: `Exercise ${id}`, tags: [] }),
    );
  });

  afterEach(() => {
    mockGetExerciseById.mockReset();
  });

  // Order: exercise 1 set 1, rest, exercise 2 set 1, rest, exercise 1 set 2,
  // rest, exercise 2 set 2, with the first `completedCount` sets completed.
  const seedSuperset = (completedCount: number) => {
    const sets = [
      generateSetEntry("1", 1, 2),
      generateSetEntry("2", 1, 2),
      generateSetEntry("1", 2, 2),
      generateSetEntry("2", 2, 2),
    ].map((set, position) => ({
      ...set,
      completed: position < completedCount,
    }));
    useTrainingStore.setState({
      exerciseList: [
        sets[0],
        generateRestEntry(),
        sets[1],
        generateRestEntry(),
        sets[2],
        generateRestEntry(),
        sets[3],
      ],
    });
  };

  it("returns the alternating exercises as one superset block", async () => {
    seedSuperset(0);

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks).toHaveLength(1);
    expect(result.current.blocks[0].isSuperset).toBe(true);
    expect(result.current.blocks[0].key).toBe(0);
    expect(result.current.blocks[0].entries.map((e) => e.exerciseId)).toEqual([
      "1",
      "2",
    ]);
  });

  it("returns a single exercise as a block that is no superset", async () => {
    useTrainingStore.setState({
      exerciseList: [generateSetEntry("1", 1, 1)],
    });

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].isSuperset).toBe(false);
  });

  it("points nextEntryKey at the first exercise before any set is done", async () => {
    seedSuperset(0);

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].nextEntryKey).toBe(0);
  });

  it("points nextEntryKey at the second exercise after the first set", async () => {
    seedSuperset(1);

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].nextEntryKey).toBe(2);
  });

  it("points nextEntryKey back at the first exercise after one round", async () => {
    seedSuperset(2);

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].nextEntryKey).toBe(0);
  });

  it("sets nextEntryKey to null when every set of the block is done", async () => {
    seedSuperset(4);

    const { result } = await renderHook(() => useTrainingListRows());

    expect(result.current.blocks[0].nextEntryKey).toBeNull();
  });
});
