import type { PlaceType } from "@/constants/workoutConstants";
import { lookupTemplate } from "@/features/customWorkouts/lookupTemplate";
import {
  getBranchReplacement,
  logSwapError,
  restoreBranchEntries,
  swapBranchFromWorkout,
  type SwapWorkout,
  type SwapWorkoutSource,
} from "@/features/training/exerciseSwap/swapWorkout";
import {
  buildUser,
  calculateDaysSinceLastWorkout,
  type GenerationContext,
  resolveSelectedPlace,
  type TrainingGenerationParams,
  useGenerationContext,
} from "@/features/training/hooks/useTrainingGeneration";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { TrainingType } from "@/features/training/models/Training";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { selectStoredTrainingDay } from "@/features/training/storedTrainingDaySelection";
import type { SwapControls } from "@/features/training/SwapExerciseButton";
import { useTrainingStore } from "@/features/training/trainingStore";
import type { StoredBranch } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import {
  createGenerationInput,
  type GenerationInput,
} from "@/features/training/workoutGenerator/generationInput/generationInput";
import { Logger } from "@/services/Logger";
import { parseIntParam } from "@/utils/router";
import { useEffect, useEffectEvent, useState } from "react";

type SwapParams = TrainingGenerationParams & { place?: string };

interface SwapRequest {
  params: SwapParams;
  ctx: GenerationContext;
  place: PlaceType;
}

/** The swap cycle of one original branch. */
interface BranchSwap {
  replacements: readonly StoredBranch[];
  /** 0 is the original branch, 1 to n the replacements. */
  position: number;
  /** The session entries of the original branch, restored at position 0. */
  originalEntries: readonly UserExerciseDataType[];
}

/** Built once after the overview renders: the source, the input and the swap cycle of each original branch. */
interface SwapSetup {
  source: SwapWorkoutSource;
  input: GenerationInput;
  swaps: Record<string, BranchSwap>;
}

interface SwapStep {
  session: UserExerciseDataType[];
  position: number;
}

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

/** Creates the input and the source of the session's workout, or null when the short workout has no template. */
const createSwapBasis = (
  request: SwapRequest,
): Omit<SwapSetup, "swaps"> | null => {
  const { params, ctx } = request;
  const { user, weekday, input } = createSwapInput(request);
  if (params.type === "PLAN") {
    const day = selectStoredTrainingDay(
      user,
      weekday,
      parseIntParam(params.sectionIndex),
      calculateDaysSinceLastWorkout(params.type, ctx),
    );
    return { source: { kind: "plan", day }, input };
  }
  const template = lookupTemplate(params.type);
  if (!template) return null;
  return { source: { kind: "short", template }, input };
};

/** Lists each non-placeholder branch of the session once, in session order. */
const listDistinctSessionBranchIds = (
  session: readonly UserExerciseDataType[],
): string[] => {
  const branchIds = session.flatMap(({ branchId }) =>
    branchId && !isPlaceholderBranch(branchId) ? [branchId] : [],
  );
  return [...new Set(branchIds)];
};

/** One swap cycle per branch of the session that has a replacement. */
const listBranchSwaps = (workout: SwapWorkout): Record<string, BranchSwap> => {
  const swaps: Record<string, BranchSwap> = {};
  for (const branchId of listDistinctSessionBranchIds(workout.session)) {
    const replacements = getBranchReplacement(workout, branchId);
    if (replacements.length === 0) continue;
    swaps[branchId] = {
      replacements,
      position: 0,
      originalEntries: workout.session.filter(
        (entry) => entry.branchId === branchId,
      ),
    };
  }
  return swaps;
};

/** Finds the branch that an exercise shows at the current position of its swap. */
const branchIdAt = (swap: BranchSwap, original: string): string =>
  swap.position === 0
    ? original
    : swap.replacements[swap.position - 1].branchId;

/** The original branch whose swap shows the given branch. */
const findOriginalBranchId = (
  swaps: Record<string, BranchSwap>,
  branchId: string,
): string | undefined =>
  Object.keys(swaps).find(
    (original) => branchIdAt(swaps[original], original) === branchId,
  );

/**
 * Walks the cycle forward from the shown branch to the first position whose
 * entries fit the session. Position 0 restores the original entries.
 */
const findNextStep = (
  workout: SwapWorkout,
  original: string,
  swap: BranchSwap,
): SwapStep | null => {
  const shown = branchIdAt(swap, original);
  const cycleLength = swap.replacements.length + 1;
  for (let step = 1; step < cycleLength; step += 1) {
    const position = (swap.position + step) % cycleLength;
    const session =
      position === 0
        ? restoreBranchEntries(workout.session, shown, swap.originalEntries)
        : swapBranchFromWorkout(
            workout,
            shown,
            swap.replacements[position - 1],
          );
    if (session !== null) return { session, position };
  }
  return null;
};

/**
 * Builds the source and the swap cycles once the session exists, after the
 * overview has rendered, from the session as first drawn.
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
      const basis = createSwapBasis(request);
      if (basis === null) return;
      const workout = { ...basis, session, skillTrees: request.ctx.skillTrees };
      setSetup({ ...basis, swaps: listBranchSwaps(workout) });
    } catch (e) {
      // When the plan day cannot be read, the overview shows no swap buttons.
      logSwapError(e);
    }
  });
  useEffect(() => {
    if (!enabled || !hasSession) return;
    // The timeout lets the overview paint before the replacements are listed
    const timeout = setTimeout(buildSetup, 0);
    return () => clearTimeout(timeout);
  }, [enabled, hasSession]);

  return { enabled, setup, setSetup };
};

/**
 * Swap state of a training overview, for plan workouts and short workouts but
 * not the strength test. Each tap on an exercise moves it to the next
 * replacement branch. After the last replacement, the next tap restores the
 * original. A swap changes only the current workout; the training plan and
 * the template are unchanged.
 */
export function useExerciseSwap(params: SwapParams, fallbackPlace: PlaceType) {
  const ctx = useGenerationContext();
  const setExerciseList = useTrainingStore((s) => s.setExerciseList);
  const request: SwapRequest = { params, ctx, place: fallbackPlace };
  const { enabled, setup, setSetup } = useSwapSetup(request);
  const swaps = setup?.swaps ?? {};

  const swapExercise = (branchId: string | undefined) => {
    const original = branchId && findOriginalBranchId(swaps, branchId);
    const session = useTrainingStore.getState().exerciseList;
    if (!original || !session || !setup) return;
    const swap = swaps[original];
    const workout: SwapWorkout = {
      session,
      source: setup.source,
      input: setup.input,
      skillTrees: ctx.skillTrees,
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
    supported: enabled,
    canSwap: (branchId) =>
      branchId !== undefined &&
      findOriginalBranchId(swaps, branchId) !== undefined,
    onSwap: swapExercise,
  };

  return { swapControls };
}
