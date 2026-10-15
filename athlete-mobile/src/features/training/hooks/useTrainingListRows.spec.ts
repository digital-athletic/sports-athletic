import { getExerciseById } from "@/data/exerciseRegistry";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE as BASELINE,
  createExercise,
  createExerciseData,
} from "@/features/training/utils/testFixtures";
import { type MaxValuesType } from "@/schemas/user.schema";
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

const BASELINE_MAX_VALUES = {
  testAt: 0,
  verticalPush: {},
  verticalPull: {},
  horizontalPush: {},
  horizontalPull: {},
  hipHinge: {},
  kneeDominant: {},
  lowerBody: {},
} as unknown as MaxValuesType;

const seedMaxValues = (overrides: Partial<MaxValuesType> = {}) => {
  useUserWorkoutStore.setState({
    workoutData: {
      sport: "OTHER_SPORT",
      tags: { POSITION: ["FIELD"], LEVEL: ["BEGINNER"] },
      seasonPhase: { type: null, endDate: "2026-01-01" },
      maxValues: { ...BASELINE_MAX_VALUES, ...overrides },
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

  it("joins set, reps, and absolute weight into one subtitle", () => {
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

    const { result } = renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBe(
      "1 of 3 · 10 repetitions · 20.00 kg",
    );
  });

  it("prefixes the weight with the dumbbell each-hand qualifier", () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: ["EQ_DUMBBELL"] }),
    );
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", weight: 20 })],
    });

    const { result } = renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBe("each 20.00 kg");
  });

  it("derives weight as a percentage of the user's max for weightFMax", () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: [] }),
    );
    seedMaxValues({ verticalPull: { barbell: 100 } });
    useTrainingStore.setState({
      exerciseList: [
        createExercise({
          exerciseId: "1",
          weight: 50,
          weightType: "weightFMax",
        }),
      ],
    });

    const { result } = renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBe("50.00 kg");
  });

  it("omits the reps segment for strength-test rows", () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: [] }),
    );
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", repetition: -1, weight: 20 }),
      ],
    });

    const { result } = renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBe("20.00 kg");
  });

  it("leaves the subtitle undefined when there is no set, reps, or weight info", () => {
    mockGetExerciseById.mockReturnValue(
      createExerciseData({ id: "1", tags: [] }),
    );
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1" })],
    });

    const { result } = renderHook(() => useTrainingListRows());

    expect(result.current.rows[0].setLabel).toBeUndefined();
  });
});
