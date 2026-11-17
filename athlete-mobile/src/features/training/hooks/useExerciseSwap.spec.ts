import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import * as swapWorkout from "@/features/training/exerciseSwap/swapWorkout";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  createAiwlPlan,
  createAiwlTraining,
} from "@/features/training/utils/testFixtures";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import { readTrainingDayWorkout } from "@/features/training/workoutGenerator/trainingDayWorkout";
import * as workoutGeneration from "@/features/training/workoutGenerator/workoutGeneration";
import { SHORT_WORKOUT_FILTERS } from "@/features/training/workoutGeneratorRouter";
import type { Template } from "@/schemas/aiwl.schema";
import { toUserExerciseData } from "@/schemas/generator.schema";
import { Logger } from "@/services/Logger";
import { useAuthStore } from "@/store/authStore";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { usePlacesStore } from "@/store/placesStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { generateGenerationInput } from "@test/factories/generationInput";
import {
  generatePlanGenerationStores,
  seedPlanGenerationStores,
} from "@test/factories/planGenerationStores";
import {
  generatePicksBlock,
  generateShortTemplate,
} from "@test/factories/templateBlock";
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
 * Builds the session of the plan day as the training store stores it, e.g.
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

/** Lists the exercise IDs of the session entries of one branch, e.g. ["510x1", "510x1"]. */
const listExerciseIdsOfBranch = (
  session: readonly UserExerciseDataType[],
  branchId: string,
) =>
  session
    .filter((entry) => entry.branchId === branchId)
    .map(({ exerciseId }) => exerciseId);

/**
 * Builds the AIWL training of a plan on Monday with one strength block of the
 * branches "510" and "523".
 *
 * generateTwoBranchStrengthTraining()
 * → { weekday: 0, focus: "PHASE", workout: { blocks: [
 *     { kind: "branches", skill: "GKS", branches: ["510", "523"], duration: 600 } ] } }
 */
const generateTwoBranchStrengthTraining = () => {
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
          branches: ["510", "523"],
          duration: 600,
        },
      ],
    },
  };
};

/**
 * Builds the session a short workout template draws with the short workout
 * filters, e.g. a template with one picks block of GKS
 * → [{ branchId: "510", skill: "GKS", exerciseId: "...", set: [1, 3] }, ...].
 */
const generateSessionOfShortWorkout = (
  template: Template,
): UserExerciseDataType[] => {
  const input = generateGenerationInput({
    place: "HOME",
    equipment: EQUIPMENT,
    exerciseCatalog: loadExercises(),
    branchLevels: { "SWR1-1": 3 },
    random: () => 0,
  });
  return workoutGeneration
    .generateSetList(template, lookUpStoredBranchInCatalog, input, {
      skillTrees: getAllSkillTrees(),
      filters: SHORT_WORKOUT_FILTERS,
    })
    .map(toUserExerciseData);
};

/** Seeds the stores of a plan athlete whose plan schedules the given training on Monday. */
const seedPlanAthlete = (
  training: ReturnType<typeof generateStrengthAndCardioTraining>,
) => {
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
};

describe("useExerciseSwap: swap in a plan training", () => {
  const training = generateStrengthAndCardioTraining();
  const params = { type: "PLAN" as const, weekday: "0" };

  beforeEach(() => {
    seedPlanAthlete(training);
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

  it("offers a swap for a plan branch and no swap for an unknown or an undefined branch", async () => {
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

  it("passes only the block of the swapped skill, with the alternative branch, to the generator", async () => {
    const result = await renderSwapHook();
    const generateSetList = jest.spyOn(workoutGeneration, "generateSetList");

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    const [swappedWorkout] = generateSetList.mock.calls[0];
    expect(swappedWorkout.blocks).toEqual([
      expect.objectContaining({
        kind: "branches",
        skill: "GKS",
        branches: [expect.not.stringMatching(/^510$/)],
      }),
    ]);
  });

  it("leaves the session unchanged and logs the event when no replacement returns a session", async () => {
    const result = await renderSwapHook();
    const before = useTrainingStore.getState().exerciseList;
    jest.spyOn(swapWorkout, "swapBranchFromWorkout").mockReturnValue(null);
    const logEvent = jest.spyOn(Logger, "logEvent").mockResolvedValue();

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    expect(useTrainingStore.getState().exerciseList).toBe(before);
    expect(logEvent).toHaveBeenCalledWith("exercise_swap_not_possible", {
      branchId: "510",
    });
  });

  it("shows the next replacement with one tap when the first replacement returns no session", async () => {
    const result = await renderSwapHook();
    const before = useTrainingStore.getState().exerciseList ?? [];
    const swapBranchFromWorkout = jest.spyOn(
      swapWorkout,
      "swapBranchFromWorkout",
    );
    swapBranchFromWorkout.mockImplementationOnce(() => null);

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    expect(swapBranchFromWorkout).toHaveBeenCalledTimes(2);
    const [[, , firstTried], [, , secondTried]] =
      swapBranchFromWorkout.mock.calls;
    const after = useTrainingStore.getState().exerciseList ?? [];
    expect(secondTried.branchId).not.toBe(firstTried.branchId);
    expect(listExerciseIdsOfBranch(after, secondTried.branchId)).not.toEqual(
      [],
    );
    expect(after).not.toEqual(before);
  });

  it("passes the skill trees of the plan day route to the generator and leaves every filter on", async () => {
    const result = await renderSwapHook();
    const generateSetList = jest.spyOn(workoutGeneration, "generateSetList");

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    const [, , , options] = generateSetList.mock.calls[0];
    expect(options).toEqual({ skillTrees: getAllSkillTrees() });
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

describe("useExerciseSwap: second swap in the same skill", () => {
  const training = generateTwoBranchStrengthTraining();
  const params = { type: "PLAN" as const, weekday: "0" };

  beforeEach(() => {
    seedPlanAthlete(training);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("swaps the second exercise and leaves the first replacement unchanged", async () => {
    const { result } = await renderHook(() => useExerciseSwap(params, "HOME"));
    await waitFor(() =>
      expect(result.current.swapControls.canSwap("523")).toBe(true),
    );

    await act(() => {
      result.current.swapControls.onSwap("510");
    });
    const afterFirst = useTrainingStore.getState().exerciseList ?? [];
    await act(() => {
      result.current.swapControls.onSwap("523");
    });

    const afterSecond = useTrainingStore.getState().exerciseList ?? [];
    // the first tap replaced 510, so the replacement is the branch that is neither 523 nor a pause
    const firstReplacementId =
      afterFirst.find(({ branchId }) => branchId !== "523" && branchId !== "-1")
        ?.branchId ?? "";
    expect(firstReplacementId).not.toBe("510");
    expect(listExerciseIdsOfBranch(afterSecond, "523")).toEqual([]);
    expect(listExerciseIdsOfBranch(afterSecond, firstReplacementId)).toEqual(
      listExerciseIdsOfBranch(afterFirst, firstReplacementId),
    );
    expect(afterSecond).not.toEqual(afterFirst);
  });
});

describe("useExerciseSwap: swap in a short training", () => {
  const params = { type: "SHORT_SWAP" };

  const seedShortWorkout = () => {
    const template = generateShortTemplate([generatePicksBlock("GKS")]);
    const stores = generatePlanGenerationStores();
    seedPlanGenerationStores({
      ...stores,
      places: { ...stores.places, HOME: { equipment: EQUIPMENT } },
    });
    usePlacesStore.setState({
      places: { ...stores.places, HOME: { equipment: EQUIPMENT } },
    });
    useAuthStore.setState({ auth: { userId: "athlete" } });
    useCustomWorkoutsStore.setState({
      workoutsById: {
        SHORT_SWAP: {
          id: "SHORT_SWAP",
          teamId: null,
          template,
          importedAt: 0,
        },
      },
    });
    const drawn = generateSessionOfShortWorkout(template);
    useTrainingStore.setState({ exerciseList: drawn });
    return drawn;
  };

  afterEach(() => {
    jest.restoreAllMocks();
    useCustomWorkoutsStore.setState({ workoutsById: {} });
  });

  it("restores the drawn entries on the last tap of the cycle, without calling the generator", async () => {
    const drawn = seedShortWorkout();
    const drawnBranchId = drawn[0].branchId;
    const { result } = await renderHook(() => useExerciseSwap(params, "HOME"));
    await waitFor(() =>
      expect(result.current.swapControls.canSwap(drawnBranchId)).toBe(true),
    );
    const generateSetList = jest.spyOn(workoutGeneration, "generateSetList");

    await act(() => {
      result.current.swapControls.onSwap(drawnBranchId);
    });
    const afterFirstTap = useTrainingStore.getState().exerciseList ?? [];

    // taps until the cycle returns to the drawn branch
    let callsBeforeLastTap = 0;
    for (let tap = 0; tap < 50; tap += 1) {
      const current = useTrainingStore.getState().exerciseList ?? [];
      const shown = current[0].branchId;
      if (shown === drawnBranchId) break;
      callsBeforeLastTap = generateSetList.mock.calls.length;
      await act(() => {
        result.current.swapControls.onSwap(shown);
      });
    }

    expect(afterFirstTap).not.toEqual(drawn);
    expect(useTrainingStore.getState().exerciseList).toEqual(drawn);
    expect(generateSetList.mock.calls.length).toBe(callsBeforeLastTap);
  });
});

describe("useExerciseSwap: support rules", () => {
  const waitForSwapSetup = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

  beforeEach(() => {
    seedPlanAthlete(generateStrengthAndCardioTraining());
  });

  it("offers no swap for the strength test", async () => {
    const { result } = await renderHook(() =>
      useExerciseSwap({ type: "TEST_WORKOUT" as const }, "HOME"),
    );
    await waitForSwapSetup();

    expect([
      result.current.swapControls.supported,
      result.current.swapControls.canSwap("510"),
    ]).toEqual([false, false]);
  });

  it("offers no swap for a plan training without a training plan", async () => {
    useUserWorkoutStore.setState({ trainingPlan: null });

    const { result } = await renderHook(() =>
      useExerciseSwap({ type: "PLAN" as const, weekday: "0" }, "HOME"),
    );
    await waitForSwapSetup();

    expect([
      result.current.swapControls.supported,
      result.current.swapControls.canSwap("510"),
    ]).toEqual([false, false]);
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
