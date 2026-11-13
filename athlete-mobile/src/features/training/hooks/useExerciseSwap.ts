import type { PlaceType } from "@/constants/workoutConstants";
import { listSwapAlternatives } from "@/features/training/exerciseSwap/swapAlternatives";
import {
  branchIdAt,
  type ExerciseSwapState,
  findNextSwap,
  listSwappableBranches,
  swapBranchInStoredDay,
  toExerciseBranch,
} from "@/features/training/exerciseSwap/exerciseSwap";
import {
  buildUser,
  calculateDaysSinceLastWorkout,
  type GenerationContext,
  resolveSelectedPlace,
  type TrainingGenerationParams,
  useGenerationContext,
} from "@/features/training/hooks/useTrainingGeneration";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { selectStoredTrainingDay } from "@/features/training/storedTrainingDaySelection";
import type { SwapControls } from "@/features/training/SwapExerciseButton";
import { useTrainingStore } from "@/features/training/trainingStore";
import { createGenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { setUpWorkout } from "@/features/training/workoutGenerator/stages/workoutSetup";
import type { StoredBranch } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import { generateTrainingDayFromStoredDay } from "@/features/training/workoutGenerator/trainingDayGeneration";
import { Logger } from "@/services/Logger";
import { parseIntParam } from "@/utils/router";
import { useEffect, useEffectEvent, useState } from "react";

type SwapParams = TrainingGenerationParams & { place?: string };

interface SwapRequest {
  params: SwapParams;
  ctx: GenerationContext;
  place: PlaceType;
}

// A fixed random draw makes each regeneration of a day return the same entries
const FIXED_RANDOM = () => 0;

/** The plan day and generation input of a swap, built once per request. */
const createSwapBasis = ({ params, ctx, place }: SwapRequest) => {
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
  const day = selectStoredTrainingDay(
    user,
    weekday,
    parseIntParam(params.sectionIndex),
    calculateDaysSinceLastWorkout(params.type, ctx),
  );
  return { day, input };
};

const listAllAlternatives = (
  request: SwapRequest,
  session: readonly UserExerciseDataType[],
): Record<string, ExerciseSwapState> => {
  const basis = createSwapBasis(request);
  const input = setUpWorkout(basis.input);
  const swaps: Record<string, ExerciseSwapState> = {};
  for (const { branchId, skill } of listSwappableBranches(session, basis.day)) {
    const others = session.filter((entry) => entry.branchId !== branchId);
    try {
      const alternatives = listSwapAlternatives(
        {
          skill,
          branchId,
          usedBranchIds: others.flatMap((entry) =>
            entry.branchId ? [entry.branchId] : [],
          ),
          usedExerciseIds: others.map(({ exerciseId }) => exerciseId),
        },
        input,
      );
      if (alternatives.length > 0) {
        swaps[branchId] = {
          skill,
          position: 0,
          alternatives,
          originalEntries: session.filter(
            (entry) => entry.branchId === branchId,
          ),
        };
      }
    } catch (e) {
      // Muscle soreness in two regions makes the listing throw. That exercise
      // gets no swap button.
      if (e instanceof Error) Logger.logError(e);
    }
  }
  return swaps;
};

/** Generates the plan day with the alternative in place of the original. */
const generateSwappedDay = (
  { day, input }: ReturnType<typeof createSwapBasis>,
  skill: string,
  original: string,
  alternative: StoredBranch,
) =>
  generateTrainingDayFromStoredDay(
    swapBranchInStoredDay(day, skill, original, toExerciseBranch(alternative)),
    input,
  );

/** The original branch whose swap shows the given branch. */
const findOriginalBranchId = (
  swaps: Record<string, ExerciseSwapState>,
  branchId: string,
): string | undefined =>
  Object.keys(swaps).find(
    (original) => branchIdAt(swaps[original], original) === branchId,
  );

/**
 * Lists the alternatives of every exercise once the session exists, after the
 * overview has rendered. Each swap state tracks its position in the cycle.
 */
const useSwapState = (request: SwapRequest) => {
  const enabled =
    request.params.type === "PLAN" && request.ctx.trainingPlan !== null;
  const hasSession = useTrainingStore((s) => s.exerciseList !== null);
  const [swaps, setSwaps] = useState<Record<string, ExerciseSwapState> | null>(
    null,
  );

  const listAlternatives = useEffectEvent(() => {
    const session = useTrainingStore.getState().exerciseList;
    if (swaps === null && session) {
      setSwaps(listAllAlternatives(request, session));
    }
  });
  useEffect(() => {
    if (!enabled || !hasSession) return;
    // The timeout lets the overview paint before the alternatives are listed
    const timeout = setTimeout(listAlternatives, 0);
    return () => clearTimeout(timeout);
  }, [enabled, hasSession]);

  return { swaps: swaps ?? {}, setSwaps };
};

/**
 * Swap state of a plan training overview. Each tap on an exercise moves it to
 * the next alternative branch. After the last alternative, the next tap
 * restores the original. A swap changes only the current workout; the
 * training plan is unchanged.
 */
export function useExerciseSwap(params: SwapParams, fallbackPlace: PlaceType) {
  const ctx = useGenerationContext();
  const setExerciseList = useTrainingStore((s) => s.setExerciseList);
  const request: SwapRequest = { params, ctx, place: fallbackPlace };
  const { swaps, setSwaps } = useSwapState(request);

  const swapExercise = (branchId: string | undefined) => {
    const original = branchId && findOriginalBranchId(swaps, branchId);
    const session = useTrainingStore.getState().exerciseList;
    if (!original || !session) return;
    const swap = swaps[original];
    const basis = createSwapBasis(request);
    const result = findNextSwap({
      session,
      original,
      swap,
      generateWith: (alternative) =>
        generateSwappedDay(basis, swap.skill, original, alternative),
    });
    if (!result || result.position === swap.position) {
      Logger.logEvent("exercise_swap_not_possible", { branchId: original });
      return;
    }
    setExerciseList(result.session);
    setSwaps({ ...swaps, [original]: { ...swap, position: result.position } });
  };

  const swapControls: SwapControls = {
    canSwap: (branchId) =>
      branchId !== undefined &&
      findOriginalBranchId(swaps, branchId) !== undefined,
    onSwap: swapExercise,
  };

  return { swapControls };
}
