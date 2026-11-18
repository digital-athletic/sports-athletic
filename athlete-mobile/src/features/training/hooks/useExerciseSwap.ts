import type { PlaceType } from "@/constants/workoutConstants";
import {
  type BranchSwap,
  findNextStep,
  findOriginalBranchId,
  listBranchSwaps,
} from "@/features/training/exerciseSwap/swapCycle";
import {
  logSwapError,
  setUpSwapWorkout,
  type SwapWorkout,
} from "@/features/training/exerciseSwap/swapWorkout";
import {
  buildUser,
  calculateDaysSinceLastWorkout,
  type GenerationContext,
  resolveSelectedPlace,
  type TrainingGenerationParams,
  useGenerationContext,
} from "@/features/training/hooks/useTrainingGeneration";
import type { TrainingType } from "@/features/training/models/Training";
import type { SwapControls } from "@/features/training/SwapExerciseButton";
import { useTrainingStore } from "@/features/training/trainingStore";
import { createGenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { selectWorkout } from "@/features/training/workoutGeneratorRouter";
import { Logger } from "@/services/Logger";
import { parseIntParam } from "@/utils/router";
import { useEffect, useEffectEvent, useState } from "react";

type SwapParams = TrainingGenerationParams & { place?: string };

interface SwapRequest {
  params: SwapParams;
  ctx: GenerationContext;
  place: PlaceType;
}

/** The workout, its set-up input and the swap cycle of each original branch. */
type SwapSetup = Omit<SwapWorkout, "session"> & {
  swaps: Record<string, BranchSwap>;
};

// A fixed random draw makes every swap to a branch return the same entries
const FIXED_RANDOM = () => 0;

/** The strength test has no swap; a plan workout needs a training plan. */
const supportsExerciseSwap = (
  type: TrainingType,
  hasTrainingPlan: boolean,
): boolean => {
  if (type === "PLAN") return hasTrainingPlan;
  return type !== "TEST_WORKOUT";
};

const createSwapInput = ({ params, ctx, place }: SwapRequest) => {
  const user = buildUser(params, ctx);
  const weekday = parseIntParam(params.weekday) ?? 0;
  const selectedPlace = resolveSelectedPlace(
    params.type,
    place,
    weekday,
    ctx.trainingDays,
  );
  const input = createGenerationInput({
    athlete: user,
    place: selectedPlace,
    equipment: ctx.places[selectedPlace]?.equipment ?? [],
    exerciseCatalog: ctx.exercises,
    exerciseData: { ...ctx.storedProgress, branchData: ctx.branchData },
    random: FIXED_RANDOM,
  });
  return { user, weekday, input };
};

/** Selects the session's workout as the generator does and sets it up once. */
const selectAndSetUpSwapWorkout = (
  request: SwapRequest,
): Omit<SwapWorkout, "session"> => {
  const { params, ctx } = request;
  const { user, weekday, input } = createSwapInput(request);
  const selection = selectWorkout({
    type: params.type,
    user,
    weekday,
    givenSection: parseIntParam(params.sectionIndex),
    daysSinceLastWorkout: calculateDaysSinceLastWorkout(params.type, ctx),
  });
  return setUpSwapWorkout(selection, input, ctx.skillTrees);
};

/**
 * Builds the set-up workout and the swap cycles once the session exists,
 * after the overview has rendered, from the session as first drawn.
 */
const useSwapSetup = (request: SwapRequest) => {
  const enabled = supportsExerciseSwap(
    request.params.type,
    request.ctx.trainingPlan !== null,
  );
  const hasSession = useTrainingStore((s) => s.exerciseList !== null);
  const [setup, setSetup] = useState<SwapSetup | null>(null);

  const buildSetup = useEffectEvent(() => {
    const session = useTrainingStore.getState().exerciseList;
    if (setup !== null || !session) return;
    try {
      const basis = selectAndSetUpSwapWorkout(request);
      setSetup({ ...basis, swaps: listBranchSwaps({ ...basis, session }) });
    } catch (e) {
      // When the workout cannot be selected or set up, the overview shows no swap buttons.
      logSwapError(e);
    }
  });
  useEffect(() => {
    if (!enabled || !hasSession) return;
    // The timeout lets the overview paint before the alternatives are listed
    const timeout = setTimeout(buildSetup, 0);
    return () => clearTimeout(timeout);
  }, [enabled, hasSession]);

  return { setup, setSetup };
};

/**
 * Swap state of a training overview. Each tap on an exercise shows its next
 * alternative, and the tap after the last alternative restores the original.
 * A swap changes only the current workout. The plan and the template stay unchanged.
 */
export function useExerciseSwap(params: SwapParams, fallbackPlace: PlaceType) {
  const ctx = useGenerationContext();
  const setExerciseList = useTrainingStore((s) => s.setExerciseList);
  const request: SwapRequest = { params, ctx, place: fallbackPlace };
  const { setup, setSetup } = useSwapSetup(request);
  const swaps = setup?.swaps ?? {};

  const swapExercise = (branchId: string | undefined) => {
    const original = branchId && findOriginalBranchId(swaps, branchId);
    const session = useTrainingStore.getState().exerciseList;
    if (!original || !session || !setup) return;
    const swap = swaps[original];
    const workout: SwapWorkout = {
      session,
      workout: setup.workout,
      input: setup.input,
    };
    const step = findNextStep(workout, original, swap);
    if (step === null) {
      Logger.logEvent("exercise_swap_not_possible", { branchId: original });
      return;
    }
    setExerciseList(step.session);
    setSetup({
      ...setup,
      swaps: { ...swaps, [original]: { ...swap, position: step.position } },
    });
  };

  const swapControls: SwapControls = {
    // The setup exists only for a workout that supports the swap
    supported: setup !== null,
    canSwap: (branchId) =>
      branchId !== undefined &&
      findOriginalBranchId(swaps, branchId) !== undefined,
    onSwap: swapExercise,
  };

  return { swapControls };
}
