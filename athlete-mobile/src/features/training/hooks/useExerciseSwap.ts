import { featureFlags } from "@/config/featureFlags";
import type { PlaceType } from "@/constants/workoutConstants";
import { listSwapAlternatives } from "@/features/training/exerciseSwap/swapAlternatives";
import { nextSwapPosition } from "@/features/training/exerciseSwap/swapCycle";
import {
  type ExerciseSwapState,
  toExerciseBranch,
} from "@/features/training/exerciseSwap/swapPlan";
import {
  holdsExerciseTwice,
  listSwappableBranches,
  raiseSwapStartLevel,
  replaceSessionBranch,
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
import { locateStoredTrainingDay } from "@/features/training/storedTrainingDaySelection";
import { useTrainingStore } from "@/features/training/trainingStore";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import { createGenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { setUpWorkout } from "@/features/training/workoutGenerator/stages/workoutSetup";
import { generateTrainingDayFromStoredDay } from "@/features/training/workoutGenerator/trainingDayGeneration";
import { Logger } from "@/services/Logger";
import { parseIntParam } from "@/utils/router";
import { useState } from "react";

type SwapParams = TrainingGenerationParams & { place?: string };

interface SwapRequest {
  params: SwapParams;
  ctx: GenerationContext;
  place: PlaceType;
}

// A fixed draw keeps the regenerated day stable, so a cycle repeats itself
const FIXED_RANDOM = () => 0;

const createRequestInput = ({ params, ctx, place }: SwapRequest) => {
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
  const locate = () =>
    locateStoredTrainingDay(
      user,
      weekday,
      parseIntParam(params.sectionIndex),
      calculateDaysSinceLastWorkout(params.type, ctx),
    );
  return { user, createInput, locate };
};

const listAllAlternatives = (
  request: SwapRequest,
  session: readonly UserExerciseDataType[],
): Record<string, ExerciseSwapState> => {
  const { createInput } = createRequestInput(request);
  const input = setUpWorkout(createInput(request.ctx.branchData));
  const swaps: Record<string, ExerciseSwapState> = {};
  for (const { branchId, skill } of listSwappableBranches(session)) {
    const others = session.filter((entry) => entry.branchId !== branchId);
    try {
      const alternatives = listSwapAlternatives(
        {
          skill,
          branchId,
          usedBranchIds: listSwappableBranches(others).map(
            (other) => other.branchId,
          ),
          usedExerciseIds: others.map(({ exerciseId }) => exerciseId),
        },
        input,
      );
      if (alternatives.length > 0) {
        swaps[branchId] = { skill, position: 0, alternatives };
      }
    } catch (e) {
      // muscle soreness in two regions throws; the exercise keeps no button
      if (e instanceof Error) Logger.logError(e);
    }
  }
  return swaps;
};

const branchIdAt = (swap: ExerciseSwapState, original: string) =>
  swap.position === 0
    ? original
    : swap.alternatives[swap.position - 1].branchId;

interface SwapAttempt {
  request: SwapRequest;
  session: UserExerciseDataType[];
  original: string;
  current: string;
  target: ExerciseSwapState;
}

/**
 * Regenerates the training day with the target Branch and returns the session
 * with its entries in place of the current ones, or null when they differ.
 */
const trySwap = ({
  request,
  session,
  original,
  current,
  target,
}: SwapAttempt): UserExerciseDataType[] | null => {
  const { user, createInput, locate } = createRequestInput(request);
  const { day } = locate();
  const branch =
    target.position > 0
      ? toExerciseBranch(target.alternatives[target.position - 1])
      : null;
  const { branchData } = request.ctx;
  const generated = generateTrainingDayFromStoredDay(
    branch ? swapBranchInStoredDay(day, target.skill, original, branch) : day,
    createInput(
      branch
        ? raiseSwapStartLevel(branchData, branch, getUserLevel(user))
        : branchData,
    ),
  );
  return replaceSessionBranch(
    session,
    current,
    generated,
    branchIdAt(target, original),
  );
};

/**
 * Walks the cycle from the current position to the next Branch whose entries
 * fit the session without repeating a Branch or an exercise it holds.
 */
const findNextSwap = (
  request: SwapRequest,
  session: UserExerciseDataType[],
  original: string,
  swap: ExerciseSwapState,
): { session: UserExerciseDataType[]; position: number } | null => {
  const sessionBranchIds = listSwappableBranches(session).map(
    ({ branchId }) => branchId,
  );
  let position = swap.position;
  for (let tries = 0; tries <= swap.alternatives.length; tries++) {
    position = nextSwapPosition(position, swap.alternatives.length);
    const target = { ...swap, position };
    const targetBranchId = branchIdAt(target, original);
    if (position > 0 && sessionBranchIds.includes(targetBranchId)) continue;
    const next = trySwap({
      request,
      session,
      original,
      current: branchIdAt(swap, original),
      target,
    });
    if (next && !holdsExerciseTwice(next, targetBranchId)) {
      return { session: next, position };
    }
  }
  return null;
};

/**
 * Lists the alternatives of every exercise once the session exists and swaps
 * are enabled, and tracks each exercise's position in its cycle.
 */
const useSwapState = (request: SwapRequest, enabled: boolean) => {
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const [alternatives, setAlternatives] = useState<Record<
    string,
    ExerciseSwapState
  > | null>(null);
  if (alternatives === null && enabled && exerciseList) {
    setAlternatives(listAllAlternatives(request, exerciseList));
  }
  const [positions, setPositions] = useState<Record<string, number>>({});
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
  const request: SwapRequest = { params, ctx, place: fallbackPlace };
  const { swaps, setPositions } = useSwapState(
    request,
    params.type === "PLAN" &&
      featureFlags.aiwlGeneratorEnabled &&
      ctx.trainingPlan !== null,
  );

  const originalBranchIdOf = (branchId: string): string | undefined =>
    Object.keys(swaps).find(
      (original) => branchIdAt(swaps[original], original) === branchId,
    );

  const canSwap = (branchId: string | undefined): boolean =>
    branchId !== undefined && originalBranchIdOf(branchId) !== undefined;

  const swapExercise = (branchId: string | undefined) => {
    const original = branchId && originalBranchIdOf(branchId);
    const session = useTrainingStore.getState().exerciseList;
    if (!original || !session) return;
    const result = findNextSwap(request, session, original, swaps[original]);
    if (result) {
      setExerciseList(result.session);
      setPositions((all) => ({ ...all, [original]: result.position }));
    }
  };

  return { canSwap, swapExercise };
}
