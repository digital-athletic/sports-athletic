import { useTrainingExerciseSheetProps } from "@/features/training/hooks/useTrainingExerciseSheetProps";
import { useTrainingListCompletion } from "@/features/training/hooks/useTrainingListCompletion";
import { useTrainingListFinish } from "@/features/training/hooks/useTrainingListFinish";
import { useTrainingListLifecycle } from "@/features/training/hooks/useTrainingListLifecycle";
import { useTrainingListReps } from "@/features/training/hooks/useTrainingListReps";
import { useTrainingListRows } from "@/features/training/hooks/useTrainingListRows";
import { useTrainingListTiming } from "@/features/training/hooks/useTrainingListTiming";
import { useTrainingStore } from "@/features/training/trainingStore";
import { findUpcomingSetIndex } from "@/features/training/utils/checklistEntries";
import { findFeaturedEntryKey } from "@/features/training/utils/featuredEntry";
import { useRouter } from "expo-router";

function useShowExerciseInfo() {
  const router = useRouter();

  return (exerciseId: string) => {
    router.push({
      pathname: "/training/exercise-information",
      params: { exerciseId },
    });
  };
}

/**
 * Composes the list-view (checklist) screen's logic from its focused
 * sub-hooks: entries per exercise, per-set completion, reps drafts, the
 * exercise sheet, the featured exercise, and screen lifecycle.
 */
export function useTrainingListScreen() {
  const handleShowInfo = useShowExerciseInfo();
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const hasHydrated = useTrainingStore((s) => s._hasHydrated);

  const { rows, blocks, allCompleted, progress } = useTrainingListRows();
  const completion = useTrainingListCompletion();
  const reps = useTrainingListReps({ onSetFinished: completion.markFinished });
  const timing = useTrainingListTiming();
  const { isFinishing, handleFinish } = useTrainingListFinish({
    allCompleted,
    endPause: timing.endPause,
    completeRestRows: completion.completeRestRows,
  });
  const { handleDiscard, isScreenFocused } = useTrainingListLifecycle({
    isEnding: isFinishing,
  });
  const { handleStart, handleRetake, sheetProps, resumeSecondsOf } =
    useTrainingExerciseSheetProps({
      rows,
      exerciseList,
      repsDraft: reps.repsDraft,
      timing,
      onChangeReps: reps.setRepsForRow,
      onSubmitReps: reps.handleSubmitReps,
      onComplete: completion.handleComplete,
      onRestEnd: completion.handleRestEnd,
      onSkip: completion.handleSkip,
    });

  const featuredEntryKey = findFeaturedEntryKey(
    blocks,
    findUpcomingSetIndex(exerciseList ?? [], completion.lastFinishedIndex),
    resumeSecondsOf,
  );

  return {
    hasHydrated,
    exerciseList,
    repsDraft: reps.repsDraft,
    blocks,
    featuredEntryKey,
    progress,
    isFinishing,
    handleFinish,
    handleShowInfo,
    handleStart,
    handleRetake,
    handleDiscard,
    resumeSecondsOf,
    sheetProps: { ...sheetProps, isScreenFocused },
  };
}
