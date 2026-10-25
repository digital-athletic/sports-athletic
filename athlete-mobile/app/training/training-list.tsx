import { CenteredLoading } from "@/common/CenteredLoading";
import { TrainingExerciseSheet } from "@/features/training/TrainingExerciseSheet";
import { TrainingListHeader } from "@/features/training/TrainingListHeader";
import { TrainingListRows } from "@/features/training/TrainingListRows";
import { useTrainingListScreen } from "@/features/training/hooks/useTrainingListScreen";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TrainingListProps = Record<string, never>;

/**
 * List-view (checklist) training execution screen: shows every exercise in
 * the session at once instead of paging through them one by one.
 * Legacy-free — feature-flagged alternative to training-active.
 */
const TrainingList: FC<TrainingListProps> = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const {
    hasHydrated,
    exerciseList,
    repsDraft,
    rows,
    allCompleted,
    isFinishing,
    handleFinish,
    handleSkip,
    handleShowInfo,
    handleStart,
    handleAbort,
    sheetProps,
  } = useTrainingListScreen();

  if (!hasHydrated || !exerciseList || exerciseList.length === 0) {
    return <CenteredLoading />;
  }

  return (
    <>
      <TrainingListHeader onAbort={handleAbort} />
      <Box
        flex={1}
        backgroundColor="white"
        style={{ paddingBottom: insets.bottom }}
      >
        <TrainingListRows
          rows={rows}
          exerciseList={exerciseList}
          repsDraft={repsDraft}
          onStart={handleStart}
          onSkip={handleSkip}
          onShowInfo={handleShowInfo}
        />
        <Box
          paddingHorizontal="l"
          paddingVertical="m"
          borderTopWidth={1}
          borderTopColor="lightGrey1"
        >
          <Button
            onPress={handleFinish}
            disabled={!allCompleted || isFinishing}
            style={{ opacity: allCompleted && !isFinishing ? 1 : 0.5 }}
            testID="training-list-finish-button"
          >
            {t("training.list.finishTraining")}
          </Button>
        </Box>
      </Box>
      <TrainingExerciseSheet {...sheetProps} />
    </>
  );
};

export default TrainingList;
