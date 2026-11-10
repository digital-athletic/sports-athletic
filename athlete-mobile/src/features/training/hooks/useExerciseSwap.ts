import { featureFlags } from "@/config/featureFlags";
import type { PlaceType } from "@/constants/workoutConstants";
import { listSwapAlternatives } from "@/features/training/exerciseSwap/swapAlternatives";
import {
  type ExerciseSwapState,
  listSwapStartLevels,
  toExerciseBranch,
} from "@/features/training/exerciseSwap/swapPlan";
import {
  findNextSwap,
  listSwappableBranches,
  swapBranchInStoredDay,
} from "@/features/training/exerciseSwap/swapSession";
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
import { getUserLevel } from "@/features/training/utils/workoutUtils";
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

// A fixed draw keeps the regenerated day stable, so a cycle repeats itself
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
  const createInput = (branchData: GenerationContext["branchData"]) =>
    createGenerationInput({
      athlete: user,
      place: selectedPlace,
      equipment: ctx.places[selectedPlace]?.equipment ?? [],
      exerciseCatalog: ctx.exercises,
      exerciseData: { ...ctx.storedProgress, branchData },
      random: FIXED_RANDOM,
    });
  const day = selectStoredTrainingDay(
    user,
    weekday,
    parseIntParam(params.sectionIndex),
    calculateDaysSinceLastWorkout(params.type, ctx),
  );
  return {
    day,
    createInput,
    branchData: ctx.branchData,
    fitnessLevel: getUserLevel(user),
  };
};

const listAllAlternatives = (
  request: SwapRequest,
  session: readonly UserExerciseDataType[],
): Record<string, ExerciseSwapState> => {
  const { day, createInput } = createSwapBasis(request);
  const input = setUpWorkout(createInput(request.ctx.branchData));
  const swaps: Record<string, ExerciseSwapState> = {};
  for (const { branchId, skill } of listSwappableBranches(session, day)) {
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
      // muscle soreness in two regions throws; the exercise keeps no button
      if (e instanceof Error) Logger.logError(e);
    }
  }
  return swaps;
};

/**
 * Generates the plan day with the alternative in place of the original
 * branch, starting the alternative from its raised level.
 */
const generateSwappedDay = (
  {
    day,
    createInput,
    branchData,
    fitnessLevel,
  }: ReturnType<typeof createSwapBasis>,
  swap: ExerciseSwapState,
  original: string,
  alternative: StoredBranch,
) => {
  const startLevels = listSwapStartLevels(
    [{ ...swap, position: 1, alternatives: [alternative] }],
    branchData,
    fitnessLevel,
  );
  return generateTrainingDayFromStoredDay(
    swapBranchInStoredDay(
      day,
      swap.skill,
      original,
      toExerciseBranch(alternative),
    ),
    createInput({
      ...branchData,
      ...Object.fromEntries(startLevels.map((l) => [l.branchId, l])),
    }),
  );
};

const branchIdAt = (swap: ExerciseSwapState, original: string) =>
  swap.position === 0
    ? original
    : swap.alternatives[swap.position - 1].branchId;

/** The original branch whose swap currently shows the given branch. */
const findOriginalBranchId = (
  swaps: Record<string, ExerciseSwapState>,
  branchId: string,
): string | undefined =>
  Object.keys(swaps).find(
    (original) => branchIdAt(swaps[original], original) === branchId,
  );

/**
 * Lists the alternatives of every exercise once the session exists, after the
 * overview has rendered, and tracks each exercise's position in its cycle.
 */
const useSwapState = (request: SwapRequest) => {
  const enabled =
    request.params.type === "PLAN" &&
    featureFlags.aiwlGeneratorEnabled &&
    request.ctx.trainingPlan !== null;
  const hasSession = useTrainingStore((s) => s.exerciseList !== null);
  const [alternatives, setAlternatives] = useState<Record<
    string,
    ExerciseSwapState
  > | null>(null);
  const [positions, setPositions] = useState<Record<string, number>>({});

  const listAlternatives = useEffectEvent(() => {
    const session = useTrainingStore.getState().exerciseList;
    if (alternatives === null && session) {
      setAlternatives(listAllAlternatives(request, session));
    }
  });
  useEffect(() => {
    if (!enabled || !hasSession) return;
    // The timeout lets the overview paint before the alternatives are listed
    const timeout = setTimeout(listAlternatives, 0);
    return () => clearTimeout(timeout);
  }, [enabled, hasSession]);

  const swaps: Record<string, ExerciseSwapState> = Object.fromEntries(
    Object.entries(alternatives ?? {}).map(([branchId, swap]) => [
      branchId,
      { ...swap, position: positions[branchId] ?? 0 },
    ]),
  );
  return { swaps, setPositions };
};

/**
 * Swap state of a plan training overview. Each tap on an exercise moves it to
 * the next alternative Branch, the fourth back to the original. A swap changes
 * only the current workout; the training plan keeps the original Branch.
 */
export function useExerciseSwap(params: SwapParams, fallbackPlace: PlaceType) {
  const ctx = useGenerationContext();
  const setExerciseList = useTrainingStore((s) => s.setExerciseList);
  const setSwapStartLevels = useTrainingStore((s) => s.setSwapStartLevels);
  const request: SwapRequest = { params, ctx, place: fallbackPlace };
  const { swaps, setPositions } = useSwapState(request);
  const originalBranchIdOf = (branchId: string) =>
    findOriginalBranchId(swaps, branchId);

  const swapExercise = (branchId: string | undefined) => {
    const original = branchId && originalBranchIdOf(branchId);
    const session = useTrainingStore.getState().exerciseList;
    if (!original || !session) return;
    const swap = swaps[original];
    const result = findNextSwap({
      session,
      original,
      swap,
      generateWith: (alternative) =>
        generateSwappedDay(
          createSwapBasis(request),
          swap,
          original,
          alternative,
        ),
    });
    if (!result || result.position === swap.position) {
      Logger.logEvent("exercise_swap_not_possible", { branchId: original });
      return;
    }
    setExerciseList(result.session);
    setPositions((all) => ({ ...all, [original]: result.position }));
  };

  const swapControls: SwapControls = {
    canSwap: (branchId) =>
      branchId !== undefined && originalBranchIdOf(branchId) !== undefined,
    onSwap: swapExercise,
  };

  /** Keeps the start levels of the swapped in Branches for their first save. */
  const startWithSwaps = () => {
    setSwapStartLevels(
      listSwapStartLevels(
        Object.values(swaps),
        ctx.branchData,
        getUserLevel(buildUser(params, ctx)),
      ),
    );
  };

  return { swapControls, startWithSwaps };
}
