import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  createAiwlPlan,
  createAiwlTraining,
} from "@/features/training/utils/testFixtures";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import * as workoutSetup from "@/features/training/workoutGenerator/stages/workoutSetup";
import { readTrainingDayWorkout } from "@/features/training/workoutGenerator/trainingDayWorkout";
import * as workoutGeneration from "@/features/training/workoutGenerator/workoutGeneration";
import { SHORT_WORKOUT_FILTERS } from "@/features/training/workoutGeneratorRouter";
import type { Block, Template } from "@/schemas/aiwl.schema";
import { toUserExerciseData } from "@/schemas/generator.schema";
import { Logger } from "@/services/Logger";
import { useAuthStore } from "@/store/authStore";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { useSetListVersionsStore } from "@/store/setListVersionsStore";
import { usePlacesStore } from "@/store/placesStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { generateGenerationInput } from "@test/factories/generationInput";
import {
  generatePlanGenerationStores,
  seedPlanGenerationStores,
} from "@test/factories/planGenerationStores";
import {
  listExerciseIdsOfBranch,
  listSetsOfBranch,
} from "@test/factories/swapSession";
import {
  generateBranchesBlock,
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
 * Builds the AIWL training of a plan on Monday with the given blocks, e.g.
 * generateMondayTraining([generateBranchesBlock("GKS", ["510"])])
 * → { weekday: 0, focus: "PHASE", workout: { blocks: [
 *     { kind: "branches", skill: "GKS", branches: ["510"], duration: 600 } ] } }
 */
const generateMondayTraining = (blocks: Block[]) => {
  const training = createAiwlTraining({
    weekday: 0,
    equipment: EQUIPMENT,
  });
  return { ...training, workout: { ...training.workout, blocks } };
};

/**
 * Builds the AIWL training of a plan on Monday with a strength block of
 * branch "510" and a cardio block of branch "576".
 *
 * generateStrengthAndCardioTraining().workout.blocks
 * → [ { kind: "branches", skill: "GKS", branches: ["510"], duration: 600 },
 *     { kind: "branches", skill: "CARDIO_5", branches: ["576"], duration: 1500 } ]
 */
const generateStrengthAndCardioTraining = () =>
  generateMondayTraining([
    generateBranchesBlock("GKS", ["510"]),
    generateBranchesBlock("CARDIO_5", ["576"], { duration: 1500 }),
  ]);

/**
 * Builds the generation input of an athlete at HOME with the equipment of the
 * specs, who trains the branch "SWR1-1" at level 3 and draws the first option.
 *
 * generateHomeInput() → { place: "HOME", equipment: ["DUMBBELL", "BARBELL", "TREADMILL"], random: () => 0, ... }
 */
const generateHomeInput = () =>
  generateGenerationInput({
    place: "HOME",
    equipment: EQUIPMENT,
    exerciseCatalog: loadExercises(),
    branchLevels: { "SWR1-1": 3 },
    random: () => 0,
  });

/**
 * Builds the session of the plan day as the training store stores it, e.g.
 * [{ branchId: "510", skill: "GKS", exerciseId: "...", set: [1, 3] }, ...,
 *  { branchId: "576", skill: "CARDIO_5", exerciseId: "...", set: [1, 1] }].
 */
const generateSessionOfPlanDay = (
  training: ReturnType<typeof generateMondayTraining>,
): UserExerciseDataType[] => {
  const { workout, lookUpBranch } = readTrainingDayWorkout(training.workout);
  return workoutGeneration
    .generateSetListFromWorkout(workout, lookUpBranch, generateHomeInput())
    .setList.map(toUserExerciseData);
};

/**
 * Builds the session a short workout template draws with the short workout
 * filters, e.g. a template with one picks block of GKS
 * → [{ branchId: "510", skill: "GKS", exerciseId: "...", set: [1, 3] }, ...].
 */
const generateSessionOfShortWorkout = (
  template: Template,
): UserExerciseDataType[] =>
  workoutGeneration
    .generateSetListFromWorkout(
      template,
      lookUpStoredBranchInCatalog,
      generateHomeInput(),
      {
        skillTrees: getAllSkillTrees(),
        filters: SHORT_WORKOUT_FILTERS,
      },
    )
    .setList.map(toUserExerciseData);

/** Seeds the stores of an athlete at HOME with the equipment of the specs. */
const seedHomeAthlete = () => {
  const stores = generatePlanGenerationStores();
  const places = { ...stores.places, HOME: { equipment: EQUIPMENT } };
  seedPlanGenerationStores({ ...stores, places });
  usePlacesStore.setState({ places });
  useAuthStore.setState({ auth: { userId: "athlete" } });
};

/** Seeds the stores of a plan athlete whose plan schedules the given training on Monday. */
const seedPlanAthlete = (
  training: ReturnType<typeof generateMondayTraining>,
) => {
  seedHomeAthlete();
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

  it("offers a swap only for a branch of the plan day", async () => {
    const result = await renderSwapHook();

    expect([
      result.current.swapControls.canSwap("510"),
      result.current.swapControls.canSwap("unknown"),
      result.current.swapControls.canSwap(undefined),
    ]).toEqual([true, false, false]);
  });

  it("replaces the branch in the session store with the alternative at the set positions of the branch", async () => {
    const result = await renderSwapHook();
    const before = useTrainingStore.getState().exerciseList ?? [];

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    const after = useTrainingStore.getState().exerciseList ?? [];
    const shown = after.find(({ skill }) => skill === "GKS")?.branchId ?? "";
    expect(shown).not.toBe("510");
    expect(listExerciseIdsOfBranch(after, "510")).toEqual([]);
    expect(listSetsOfBranch(after, shown)).toEqual(
      listSetsOfBranch(before, "510"),
    );
  });

  // The session loses branch 510 after the setup, so no step of its cycle fits.
  it("leaves the session unchanged and logs the event when no alternative returns a session", async () => {
    const result = await renderSwapHook();
    const without510 = (useTrainingStore.getState().exerciseList ?? []).filter(
      ({ branchId }) => branchId !== "510",
    );
    useTrainingStore.setState({ exerciseList: without510 });
    const logEvent = jest.spyOn(Logger, "logEvent").mockResolvedValue();

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    expect(useTrainingStore.getState().exerciseList).toBe(without510);
    expect(logEvent).toHaveBeenCalledWith("exercise_swap_not_possible", {
      branchId: "510",
    });
  });

  it("leaves the session unchanged for a branch without a swap", async () => {
    const result = await renderSwapHook();
    const before = useTrainingStore.getState().exerciseList;

    await act(() => {
      result.current.swapControls.onSwap("unknown");
    });

    expect(useTrainingStore.getState().exerciseList).toBe(before);
  });
});

describe("useExerciseSwap: second swap in the same skill", () => {
  const training = generateMondayTraining([
    generateBranchesBlock("GKS", ["510", "523"]),
  ]);
  const params = { type: "PLAN" as const, weekday: "0" };

  beforeEach(() => {
    seedPlanAthlete(training);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sets up the workout once for the whole overview", async () => {
    const setUpWorkout = jest.spyOn(workoutSetup, "setUpWorkout");

    const { result } = await renderHook(() => useExerciseSwap(params, "HOME"));
    await waitFor(() =>
      expect(result.current.swapControls.canSwap("523")).toBe(true),
    );

    expect(setUpWorkout).toHaveBeenCalledTimes(1);
  });

  it("swaps the second exercise and leaves the first alternative unchanged", async () => {
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
    // the first tap replaced 510, so the alternative is the branch that is neither 523 nor a pause
    const firstAlternativeId =
      afterFirst.find(({ branchId }) => branchId !== "523" && branchId !== "-1")
        ?.branchId ?? "";
    expect(firstAlternativeId).not.toBe("510");
    expect(listExerciseIdsOfBranch(afterSecond, "523")).toEqual([]);
    expect(listExerciseIdsOfBranch(afterSecond, firstAlternativeId)).toEqual(
      listExerciseIdsOfBranch(afterFirst, firstAlternativeId),
    );
    expect(afterSecond).not.toEqual(afterFirst);
  });
});

describe("useExerciseSwap: swap in a short training", () => {
  const params = { type: "SHORT_SWAP" };

  const seedShortWorkout = () => {
    const template = generateShortTemplate([generatePicksBlock("GKS")]);
    seedHomeAthlete();
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
    useSetListVersionsStore.setState({ versionsByWorkout: {} });
  });

  it("leaves the saved versions unchanged after a swap", async () => {
    const drawn = seedShortWorkout();
    const drawnBranchId = drawn[0].branchId ?? "";
    const template =
      useCustomWorkoutsStore.getState().workoutsById.SHORT_SWAP.template;
    useSetListVersionsStore.setState({
      versionsByWorkout: {
        SHORT_SWAP: {
          HOME: {
            templateBlocks: JSON.stringify(template.blocks),
            blocks: [
              {
                block: generateBranchesBlock("GKS", [drawnBranchId], {
                  duration: undefined,
                }),
                templateIndex: 0,
              },
            ],
          },
        },
      },
      _hasHydrated: true,
    });
    const before = structuredClone(
      useSetListVersionsStore.getState().versionsByWorkout,
    );
    const { result } = await renderHook(() => useExerciseSwap(params, "HOME"));
    await waitFor(() =>
      expect(result.current.swapControls.canSwap(drawnBranchId)).toBe(true),
    );

    await act(() => {
      result.current.swapControls.onSwap(drawnBranchId);
    });

    expect(useTrainingStore.getState().exerciseList?.[0].branchId).not.toBe(
      drawnBranchId,
    );
    expect(useSetListVersionsStore.getState().versionsByWorkout).toEqual(
      before,
    );
  });

  it("lists the alternatives of the original template for a session replayed from a saved version", async () => {
    seedShortWorkout();
    const replayed = workoutGeneration
      .generateFinishedWorkout(
        {
          id: "SHORT_SWAP",
          blocks: [
            generateBranchesBlock("GKS", ["510"], { duration: undefined }),
          ],
        },
        lookUpStoredBranchInCatalog,
        generateHomeInput(),
        { skillTrees: getAllSkillTrees(), filters: SHORT_WORKOUT_FILTERS },
      )
      .setList.map(toUserExerciseData);
    useTrainingStore.setState({ exerciseList: replayed });
    const { result } = await renderHook(() => useExerciseSwap(params, "HOME"));
    await waitFor(() =>
      expect(result.current.swapControls.canSwap("510")).toBe(true),
    );

    await act(() => {
      result.current.swapControls.onSwap("510");
    });

    const shown = useTrainingStore.getState().exerciseList?.[0].branchId;
    expect(shown).not.toBe("510");
    expect(Object.keys(getAllSkillTrees().GKS)).toContain(shown);
  });

  it("restores the drawn entries on the last tap of the cycle", async () => {
    const drawn = seedShortWorkout();
    const drawnBranchId = drawn[0].branchId;
    const { result } = await renderHook(() => useExerciseSwap(params, "HOME"));
    await waitFor(() =>
      expect(result.current.swapControls.canSwap(drawnBranchId)).toBe(true),
    );

    await act(() => {
      result.current.swapControls.onSwap(drawnBranchId);
    });
    const afterFirstTap = useTrainingStore.getState().exerciseList ?? [];

    // 50 taps bound the loop; the cycle ends at the drawn branch
    for (let tap = 0; tap < 50; tap += 1) {
      const current = useTrainingStore.getState().exerciseList ?? [];
      const shown = current[0].branchId;
      if (shown === drawnBranchId) break;
      await act(() => {
        result.current.swapControls.onSwap(shown);
      });
    }

    expect(afterFirstTap).not.toEqual(drawn);
    expect(useTrainingStore.getState().exerciseList).toEqual(drawn);
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

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("offers no swap before the setup timeout runs", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() =>
      useExerciseSwap({ type: "PLAN" as const, weekday: "0" }, "HOME"),
    );
    const supportedBefore = result.current.swapControls.supported;

    await act(() => {
      jest.runOnlyPendingTimers();
    });

    expect([supportedBefore, result.current.swapControls.supported]).toEqual([
      false,
      true,
    ]);
  });

  it("offers no swap and logs one error when the setup fails", async () => {
    const logError = jest.spyOn(Logger, "logError").mockImplementation();

    const { result } = await renderHook(() =>
      useExerciseSwap({ type: "MISSING_TEMPLATE" }, "HOME"),
    );
    await waitForSwapSetup();

    expect([
      result.current.swapControls.supported,
      result.current.swapControls.canSwap("510"),
      logError.mock.calls.length,
    ]).toEqual([false, false, 1]);
  });

  // The tree CARDIO_5 holds the one branch 576, so no branch has an alternative.
  it("offers the swap setup but no swap for a plan day without alternatives", async () => {
    seedPlanAthlete(
      generateMondayTraining([
        generateBranchesBlock("CARDIO_5", ["576"], { duration: 1500 }),
      ]),
    );

    const { result } = await renderHook(() =>
      useExerciseSwap({ type: "PLAN" as const, weekday: "0" }, "HOME"),
    );
    await waitForSwapSetup();

    const session = useTrainingStore.getState().exerciseList ?? [];
    expect(listExerciseIdsOfBranch(session, "576").length).toBeGreaterThan(0);
    expect([
      result.current.swapControls.supported,
      result.current.swapControls.canSwap("576"),
    ]).toEqual([true, false]);
  });

  it("offers no swap for the strength test", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() =>
      useExerciseSwap({ type: "TEST_WORKOUT" as const }, "HOME"),
    );
    await act(() => {
      jest.runOnlyPendingTimers();
    });

    expect([
      result.current.swapControls.supported,
      result.current.swapControls.canSwap("510"),
    ]).toEqual([false, false]);
  });

  it("offers no swap for a plan training without a training plan", async () => {
    useUserWorkoutStore.setState({ trainingPlan: null });
    jest.useFakeTimers();

    const { result } = await renderHook(() =>
      useExerciseSwap({ type: "PLAN" as const, weekday: "0" }, "HOME"),
    );
    await act(() => {
      jest.runOnlyPendingTimers();
    });

    expect([
      result.current.swapControls.supported,
      result.current.swapControls.canSwap("510"),
    ]).toEqual([false, false]);
  });
});
