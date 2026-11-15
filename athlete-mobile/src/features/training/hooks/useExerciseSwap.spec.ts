import { loadExercises } from "@/data/loadExercises";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  createAiwlPlan,
  createAiwlTraining,
} from "@/features/training/utils/testFixtures";
import { readTrainingDayWorkout } from "@/features/training/workoutGenerator/trainingDayWorkout";
import * as workoutGeneration from "@/features/training/workoutGenerator/workoutGeneration";
import { toUserExerciseData } from "@/schemas/generator.schema";
import { useAuthStore } from "@/store/authStore";
import { usePlacesStore } from "@/store/placesStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { generateGenerationInput } from "@test/factories/generationInput";
import {
  generatePlanGenerationStores,
  seedPlanGenerationStores,
} from "@test/factories/planGenerationStores";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useExerciseSwap } from "./useExerciseSwap";

jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: jest.fn(), replace: jest.fn() }),
}));

const EQUIPMENT = ["DUMBBELL", "BARBELL", "TREADMILL"];

/**
 * Builds the AIWL training of a plan on Monday with a strength block of
 * branch "510" and a cardio block of branch "576".
 *
 * generateStrengthAndCardioTraining()
 * → { weekday: 0, focus: "PHASE", workout: { blocks: [
 *     { kind: "branches", skill: "GKS", branches: ["510"], duration: 600 },
 *     { kind: "branches", skill: "CARDIO_5", branches: ["576"], duration: 1500 } ] } }
 */
const generateStrengthAndCardioTraining = () => {
  const training = createAiwlTraining({
    weekday: 0,
    equipment: EQUIPMENT,
  });
  return {
    ...training,
    workout: {
      ...training.workout,
      blocks: [
        {
          kind: "branches" as const,
          skill: "GKS" as const,
          branches: ["510"],
          duration: 600,
        },
        {
          kind: "branches" as const,
          skill: "CARDIO_5" as const,
          branches: ["576"],
          duration: 1500,
        },
      ],
    },
  };
};

/**
 * Builds the session of the plan day as the training store holds it, e.g.
 * [{ branchId: "510", skill: "GKS", exerciseId: "...", set: [1, 3] }, ...,
 *  { branchId: "576", skill: "CARDIO_5", exerciseId: "...", set: [1, 1] }].
 */
const generateSessionOfPlanDay = (
  training: ReturnType<typeof generateStrengthAndCardioTraining>,
): UserExerciseDataType[] => {
  const { workout, lookUpBranch } = readTrainingDayWorkout(training.workout);
  const input = generateGenerationInput({
    place: "HOME",
    equipment: EQUIPMENT,
    exerciseCatalog: loadExercises(),
    branchLevels: { "SWR1-1": 3 },
    random: () => 0,
  });
  return workoutGeneration
    .generateSetList(workout, lookUpBranch, input)
    .map(toUserExerciseData);
};

/** Lists each skill once in the order the session trains it, e.g. ["GKS", "CARDIO_5"]. */
const listSkillOrder = (session: readonly UserExerciseDataType[]) => [
  ...new Set(session.map(({ skill }) => skill)),
];

/** Lists the exercise IDs of the session entries of one branch, e.g. ["510x1", "510x1"]. */
const listExerciseIdsOfBranch = (
  session: readonly UserExerciseDataType[],
  branchId: string,
) =>
  session
    .filter((entry) => entry.branchId === branchId)
    .map(({ exerciseId }) => exerciseId);

describe("useExerciseSwap: swap in a plan training", () => {
  const training = generateStrengthAndCardioTraining();
  const params = { type: "PLAN" as const, weekday: "0" };

  beforeEach(() => {
    const stores = generatePlanGenerationStores();
    seedPlanGenerationStores({
      ...stores,
      places: { ...stores.places, HOME: { equipment: EQUIPMENT } },
    });
    usePlacesStore.setState({
      places: { ...stores.places, HOME: { equipment: EQUIPMENT } },
    });
    useAuthStore.setState({ auth: { userId: "athlete" } });
    useUserWorkoutStore.setState({
      trainingPlan: createAiwlPlan([training]),
      temporalData: [],
    });
    useTrainingStore.setState({
      exerciseList: generateSessionOfPlanDay(training),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderSwapHook = async () => {
    const { result } = await renderHook(() => useExerciseSwap(params, "HOME"));
    await waitFor(() =>
      expect(result.current.swapControls.canSwap("510")).toBe(true),
    );
    return result;
  };

  it("offers a swap for a plan branch and none for an unknown branch", async () => {
    const result = await renderSwapHook();

    expect([
      result.current.swapControls.canSwap("510"),
      result.current.swapControls.canSwap("unknown"),
      result.current.swapControls.canSwap(undefined),
    ]).toEqual([true, false, false]);
  });

  it("puts the exercise of the alternative branch in the session", async () => {
    const result = await renderSwapHook();
    const before = useTrainingStore.getState().exerciseList ?? [];

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    const after = useTrainingStore.getState().exerciseList ?? [];
    expect(listExerciseIdsOfBranch(after, "510")).toEqual([]);
    expect(after.map(({ exerciseId }) => exerciseId)).not.toEqual(
      before.map(({ exerciseId }) => exerciseId),
    );
  });

  it("keeps the order of the sections after a swap", async () => {
    const result = await renderSwapHook();
    const before = useTrainingStore.getState().exerciseList ?? [];

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    const after = useTrainingStore.getState().exerciseList ?? [];
    expect(listSkillOrder(after)).toEqual(listSkillOrder(before));
  });

  it("keeps the other branch of the session unchanged", async () => {
    const result = await renderSwapHook();
    const before = useTrainingStore.getState().exerciseList ?? [];

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    const after = useTrainingStore.getState().exerciseList ?? [];
    expect(listExerciseIdsOfBranch(after, "576")).toEqual(
      listExerciseIdsOfBranch(before, "576"),
    );
  });

  it("generates the swapped day through the entry point with the alternative branch", async () => {
    const result = await renderSwapHook();
    const generateSetList = jest.spyOn(workoutGeneration, "generateSetList");

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    const [swappedWorkout] = generateSetList.mock.calls[0];
    const strengthBlock = swappedWorkout.blocks.find(
      (block) => block.kind === "branches" && block.skill === "GKS",
    );
    expect(strengthBlock).toEqual(
      expect.objectContaining({
        branches: [expect.not.stringMatching(/^510$/)],
      }),
    );
  });

  it("restores the original session after the last alternative", async () => {
    const result = await renderSwapHook();
    const before = useTrainingStore.getState().exerciseList ?? [];

    // taps until the cycle returns to the original
    for (let tap = 0; tap < 50; tap += 1) {
      const current = useTrainingStore.getState().exerciseList ?? [];
      const shown = current.find(({ skill }) => skill === "GKS")?.branchId;
      if (tap > 0 && shown === "510") break;
      await act(() => {
        result.current.swapControls.onSwap(shown);
      });
    }

    expect(useTrainingStore.getState().exerciseList).toEqual(before);
  });

  it("does nothing for a branch without a swap", async () => {
    const result = await renderSwapHook();
    const before = useTrainingStore.getState().exerciseList;

    await act(() => {
      result.current.swapControls.onSwap("unknown");
    });

    expect(useTrainingStore.getState().exerciseList).toBe(before);
  });
});

describe("useExerciseSwap: no plan training", () => {
  it("offers no swap for a training that is not a plan day", async () => {
    useTrainingStore.setState({
      exerciseList: generateSessionOfPlanDay(
        generateStrengthAndCardioTraining(),
      ),
    });

    const { result } = await renderHook(() =>
      useExerciseSwap({ type: "FOCUS" as const }, "HOME"),
    );

    expect(result.current.swapControls.canSwap("510")).toBe(false);
  });
});
