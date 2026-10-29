import { getExerciseById } from "@/data/exerciseRegistry";
import {
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "@/features/training/models/MaxValues";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE as BASELINE,
  createExercise,
  createExerciseData,
} from "@/features/training/utils/testFixtures";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { renderHook } from "@testing-library/react-native";
import { useTrainingListRows } from "./useTrainingListRows";

jest.mock("@/data/exerciseRegistry", () => ({
  getExerciseById: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      switch (key) {
        case "training.active.set":
          return `${options?.current} of ${options?.total}`;
        case "training.overview.repetitions":
          return `${options?.count} repetitions`;
        case "training.overview.kilos":
          return `${options?.weight} kg`;
        case "training.active.2x":
          return "each ";
        default:
          return key;
      }
    },
  }),
}));

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
    expect(result.current.rows[0].targetReps).toBe(10);
    expect(result.current.rows[0].targetWeight).toEqual({
      kilos: 20,
      isPerHand: false,
    });
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
    expect(result.current.rows[0].targetWeight).toEqual({
      kilos: 20,
      isPerHand: true,
    });
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
    expect(result.current.rows[0].targetReps).toBeUndefined();
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
