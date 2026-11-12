import { CenteredLoading } from "@/common/CenteredLoading";
import { TrainingExerciseSheet } from "@/features/training/TrainingExerciseSheet";
import { TrainingListHeader } from "@/features/training/TrainingListHeader";
import { TrainingListRows } from "@/features/training/TrainingListRows";
import { TrainingProgressBar } from "@/features/training/TrainingProgressBar";
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
    sheetProps,
  } = useTrainingListScreen();

  if (!hasHydrated || !exerciseList || exerciseList.length === 0) {
    return <CenteredLoading />;
  }

  return (
    <>
      <TrainingListHeader onBack={handleDiscard} />
      <Box
        flex={1}
        backgroundColor="surface"
        style={{ paddingBottom: insets.bottom }}
      >
        <TrainingListRows
          blocks={blocks}
          exerciseList={exerciseList}
          repsDraft={repsDraft}
          featuredEntryKey={featuredEntryKey}
          resumeSecondsOf={resumeSecondsOf}
          onStart={handleStart}
          onRetake={handleRetake}
          onShowInfo={handleShowInfo}
        />
        <Box
          paddingHorizontal="l"
          paddingVertical="m"
          borderTopWidth={1}
          borderTopColor="surfaceContainerLow"
        >
          <Box marginBottom="m" borderRadius="round" overflow="hidden">
            <TrainingProgressBar progress={progress} />
          </Box>
          <Button
            onPress={handleFinish}
            disabled={isFinishing}
            style={{ opacity: isFinishing ? 0.5 : 1 }}
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
