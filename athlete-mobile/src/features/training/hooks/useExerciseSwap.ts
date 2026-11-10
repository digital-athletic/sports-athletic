import { featureFlags } from "@/config/featureFlags";
import type { PlaceType } from "@/constants/workoutConstants";
import { listSwapAlternatives } from "@/features/training/exerciseSwap/swapAlternatives";
import { nextSwapPosition } from "@/features/training/exerciseSwap/swapCycle";
import {
  collectPlanSwaps,
  type ExerciseSwapState,
  resolvePlanSectionIndex,
  toExerciseBranch,
} from "@/features/training/exerciseSwap/swapPlan";
import {
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
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { selectStoredTrainingDay } from "@/features/training/storedTrainingDaySelection";
import { useTrainingStore } from "@/features/training/trainingStore";
import { getRaisedSubstituteLevel } from "@/features/training/utils/substitutionLevelUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import { createGenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { setUpWorkout } from "@/features/training/workoutGenerator/stages/workoutSetup";
import { generateTrainingDayFromStoredDay } from "@/features/training/workoutGenerator/trainingDayGeneration";
import { Logger } from "@/services/Logger";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { parseIntParam } from "@/utils/router";
import { useState } from "react";

type SwapParams = TrainingGenerationParams & { place?: string };

interface SwapRequest {
  params: SwapParams;
  ctx: GenerationContext;
  place: PlaceType;
}

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
    });
  return { user, weekday, createInput };
};

const listBranchIds = (list: readonly UserExerciseDataType[]): string[] => [
  ...new Set(
    list.flatMap(({ branchId }) =>
      branchId && !isPlaceholderBranch(branchId) ? [branchId] : [],
    ),
  ),
];

const listAllAlternatives = (
  request: SwapRequest,
  session: readonly UserExerciseDataType[],
): Record<string, ExerciseSwapState> => {
  const { createInput } = createRequestInput(request);
  const input = setUpWorkout(createInput(request.ctx.branchData));
  const swaps: Record<string, ExerciseSwapState> = {};
  for (const branchId of listBranchIds(session)) {
    const own = session.filter((entry) => entry.branchId === branchId);
    const others = session.filter((entry) => entry.branchId !== branchId);
    try {
      const alternatives = listSwapAlternatives(
        {
          skill: own[0].skill,
          branchId,
          usedBranchIds: listBranchIds(others),
          usedExerciseIds: others.map(({ exerciseId }) => exerciseId),
        },
        input,
      );
      if (alternatives.length > 0) {
        swaps[branchId] = { skill: own[0].skill, position: 0, alternatives };
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
  const { params, ctx } = request;
  const { user, weekday, createInput } = createRequestInput(request);
  const day = selectStoredTrainingDay(
    user,
    weekday,
    parseIntParam(params.sectionIndex),
    calculateDaysSinceLastWorkout(params.type, ctx),
  );
  const branch =
    target.position > 0
      ? toExerciseBranch(target.alternatives[target.position - 1])
      : null;
  const generated = generateTrainingDayFromStoredDay(
    branch ? swapBranchInStoredDay(day, target.skill, original, branch) : day,
    createInput(
      branch
        ? raiseSwapStartLevel(ctx.branchData, branch, getUserLevel(user))
        : ctx.branchData,
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
 * fit the session, skipping Branches the session already holds.
 */
const findNextSwap = (
  request: SwapRequest,
  session: UserExerciseDataType[],
  original: string,
  swap: ExerciseSwapState,
): { session: UserExerciseDataType[]; position: number } | null => {
  const sessionBranchIds = listBranchIds(session);
  let position = swap.position;
  for (let tries = 0; tries <= swap.alternatives.length; tries++) {
    position = nextSwapPosition(position, swap.alternatives.length);
    const target = { ...swap, position };
    if (
      position > 0 &&
      sessionBranchIds.includes(branchIdAt(target, original))
    ) {
      continue;
    }
    const next = trySwap({
      request,
      session,
      original,
      current: branchIdAt(swap, original),
      target,
    });
    if (next) return { session: next, position };
  }
  return null;
};

interface PlanWriters {
  setBranchLevel: (branchId: string, level: number, exerciseId: string) => void;
  replaceBranchInTrainingPlan: ReturnType<
    typeof useUserWorkoutStore.getState
  >["replaceBranchInTrainingPlan"];
}

/** Writes the swapped Branches into the plan for the training's weekday. */
const commitPlanSwaps = (
  { params, ctx }: SwapRequest,
  swaps: Readonly<Record<string, ExerciseSwapState>>,
  writers: PlanWriters,
) => {
  const plan = useUserWorkoutStore.getState().trainingPlan;
  const planSwaps = collectPlanSwaps(swaps);
  if (!plan || planSwaps.length === 0) return;
  const sectionIndex = resolvePlanSectionIndex(
    plan,
    parseIntParam(params.sectionIndex),
    new Date(),
  );
  const weekday = parseIntParam(params.weekday) ?? 0;
  const fitnessLevel = getUserLevel(buildUser(params, ctx));
  for (const { skill, originalBranchId, branch } of planSwaps) {
    const raised = getRaisedSubstituteLevel(
      branch,
      ctx.branchData,
      fitnessLevel,
    );
    if (raised) {
      writers.setBranchLevel(raised.branchId, raised.level, raised.exerciseId);
    }
    writers.replaceBranchInTrainingPlan(
      sectionIndex,
      weekday,
      skill,
      originalBranchId,
      [branch],
    );
  }
};

/**
 * Lists the alternatives of every exercise once the session exists, and
 * tracks each exercise's position in its cycle.
 */
const useSwapState = (request: SwapRequest, enabled: boolean) => {
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const [alternatives, setAlternatives] = useState<Record<
    string,
    ExerciseSwapState
  > | null>(null);
  if (alternatives === null && exerciseList) {
    setAlternatives(enabled ? listAllAlternatives(request, exerciseList) : {});
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
 * the next alternative Branch, the fourth back to the original. The plan
 * changes only on `commitSwaps`, when the athlete starts the training.
 */
export function useExerciseSwap(params: SwapParams, fallbackPlace: PlaceType) {
  const ctx = useGenerationContext();
  const setExerciseList = useTrainingStore((s) => s.setExerciseList);
  const replaceBranchInTrainingPlan = useUserWorkoutStore(
    (s) => s.replaceBranchInTrainingPlan,
  );
  const setBranchLevel = useExerciseProgressStore((s) => s.setBranchLevel);
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

  const commitSwaps = () =>
    commitPlanSwaps(request, swaps, {
      setBranchLevel,
      replaceBranchInTrainingPlan,
    });

  return { canSwap, swapExercise, commitSwaps };
}
