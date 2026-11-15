import type { PlaceType } from "@/constants/workoutConstants";
import { lookupTemplate } from "@/features/customWorkouts/lookupTemplate";
import {
  branchIdAt,
  type ExerciseSwapState,
  findNextSwap,
} from "@/features/training/exerciseSwap/exerciseSwap";
import {
  createPlanSwapSource,
  createShortWorkoutSwapSource,
  type SwapSource,
  supportsExerciseSwap,
} from "@/features/training/exerciseSwap/swapSource";
import {
  buildUser,
  calculateDaysSinceLastWorkout,
  type GenerationContext,
  resolveSelectedPlace,
  type TrainingGenerationParams,
  useGenerationContext,
} from "@/features/training/hooks/useTrainingGeneration";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { isGeneratorError } from "@/features/training/models/GeneratorError";
import { selectStoredTrainingDay } from "@/features/training/storedTrainingDaySelection";
import type { SwapControls } from "@/features/training/SwapExerciseButton";
import { useTrainingStore } from "@/features/training/trainingStore";
import { createGenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { Logger } from "@/services/Logger";
import { parseIntParam } from "@/utils/router";
import { useEffect, useEffectEvent, useState } from "react";

type SwapParams = TrainingGenerationParams & { place?: string };

interface SwapRequest {
  params: SwapParams;
  ctx: GenerationContext;
  place: PlaceType;
}

// A fixed random draw makes each regeneration of a workout return the same entries
const FIXED_RANDOM = () => 0;

/** Builds the swap source of the workout the session holds, or null without a template. */
const createSwapSource = (
  { params, ctx, place }: SwapRequest,
  session: readonly UserExerciseDataType[],
): SwapSource | null => {
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
  if (params.type === "PLAN") {
    const day = selectStoredTrainingDay(
      user,
      weekday,
      parseIntParam(params.sectionIndex),
      calculateDaysSinceLastWorkout(params.type, ctx),
    );
    return createPlanSwapSource(day, input, ctx.skillTrees, session);
  }
  const template = lookupTemplate(params.type);
  if (!template) return null;
  return createShortWorkoutSwapSource(template, input, ctx.skillTrees, session);
};

// A generator error is a plain object; its params can name pains, so only its type is logged.
const logSwapError = (e: unknown) => {
  if (e instanceof Error) {
    Logger.logError(e);
    return;
  }
  const reason = isGeneratorError(e) ? `${e.type}/${e.subtype}` : "unknown";
  Logger.logError(new Error(`Exercise swap failed: ${reason}`));
};

/** The original branch whose swap shows the given branch. */
const findOriginalBranchId = (
  swaps: Record<string, ExerciseSwapState>,
  branchId: string,
): string | undefined =>
  Object.keys(swaps).find(
    (original) => branchIdAt(swaps[original], original) === branchId,
  );

/**
 * Builds the swap source once the session exists, after the overview has
 * rendered, from the session as first drawn. Each swap state tracks its
 * position in the cycle.
 */
const useSwapState = (request: SwapRequest) => {
  const enabled = supportsExerciseSwap(
    request.params.type,
    request.ctx.trainingPlan !== null,
  );
  const hasSession = useTrainingStore((s) => s.exerciseList !== null);
  const [state, setState] = useState<{
    source: SwapSource;
    swaps: Record<string, ExerciseSwapState>;
  } | null>(null);

  const buildSource = useEffectEvent(() => {
    const session = useTrainingStore.getState().exerciseList;
    if (state !== null || !session) return;
    try {
      const source = createSwapSource(request, session);
      if (source) setState({ source, swaps: source.swaps });
    } catch (e) {
      // A workout that cannot be regenerated keeps its overview without swap buttons.
      logSwapError(e);
    }
  });
  useEffect(() => {
    if (!enabled || !hasSession) return;
    // The timeout lets the overview paint before the alternatives are listed
    const timeout = setTimeout(buildSource, 0);
    return () => clearTimeout(timeout);
  }, [enabled, hasSession]);

  return { enabled, state, swaps: state?.swaps ?? {}, setState };
};

/** The next step of the swap cycle, or null when the workout cannot be regenerated. */
const findNextStep = (
  source: SwapSource,
  session: readonly UserExerciseDataType[],
  original: string,
  swap: ExerciseSwapState,
) => {
  try {
    return findNextSwap({
      session,
      original,
      swap,
      generateWith: (alternative) =>
        source.generateSwapped(swap.skill, original, alternative),
    });
  } catch (e) {
    // The session stays as it is, as for a cycle without a fitting branch.
    logSwapError(e);
    return null;
  }
};

/**
 * Swap state of a training overview, for plan workouts and short workouts but
 * not the strength test. Each tap on an exercise moves it to the next
 * alternative branch. After the last alternative, the next tap restores the
 * original. A swap changes only the current workout; the training plan and
 * the template are unchanged.
 */
export function useExerciseSwap(params: SwapParams, fallbackPlace: PlaceType) {
  const ctx = useGenerationContext();
  const setExerciseList = useTrainingStore((s) => s.setExerciseList);
  const request: SwapRequest = { params, ctx, place: fallbackPlace };
  const { enabled, state, swaps, setState } = useSwapState(request);

  const swapExercise = (branchId: string | undefined) => {
    const original = branchId && findOriginalBranchId(swaps, branchId);
    const session = useTrainingStore.getState().exerciseList;
    if (!original || !session || !state) return;
    const swap = swaps[original];
    const result = findNextStep(state.source, session, original, swap);
    if (!result || result.position === swap.position) {
      Logger.logEvent("exercise_swap_not_possible", { branchId: original });
      return;
    }
    setExerciseList(result.session);
    setState({
      source: state.source,
      swaps: { ...swaps, [original]: { ...swap, position: result.position } },
    });
  };

  const swapControls: SwapControls = {
    supported: enabled,
    canSwap: (branchId) =>
      branchId !== undefined &&
      findOriginalBranchId(swaps, branchId) !== undefined,
    onSwap: swapExercise,
  };

  return { swapControls };
}
