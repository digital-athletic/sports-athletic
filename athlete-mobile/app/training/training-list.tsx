import { Ionicon } from "@/common/Ionicon";
import { featureFlags } from "@/config/featureFlags";
import { getExerciseById } from "@/data/exerciseRegistry";
import {
  TrainingListItem,
  type TrainingListItemFeedback,
} from "@/features/training/TrainingListItem";
import { useExerciseCompletion } from "@/features/training/hooks/useExerciseCompletion";
import { useFinishTraining } from "@/features/training/hooks/useFinishTraining";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { useTrainingStore } from "@/features/training/trainingStore";
import { isFeedbackEligibleSkill } from "@/features/training/utils/exerciseDataUtils";
import { getIncompleteCount } from "@/features/training/utils/listCompletionUtils";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { useTheme } from "@/theme/theme";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TrainingListProps = Record<string, never>;

type ListRow = {
  index: number;
  exerciseId: string;
  displayName: string;
  setLabel?: string;
  isTest: boolean;
  isLastInSet: boolean;
  isFeedbackSkill: boolean;
};

/**
 * List-view (checklist) training execution screen: shows every exercise in
 * the session at once instead of paging through them one by one.
 * Legacy-free — feature-flagged alternative to training-active.
 */
const TrainingList: FC<TrainingListProps> = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const activeTraining = useTrainingStore((s) => s.activeTraining);
  const completedExerciseIndices = useTrainingStore(
    (s) => s.completedExerciseIndices,
  );
  const markExerciseCompleted = useTrainingStore(
    (s) => s.markExerciseCompleted,
  );
  const tempMaxValues = useTrainingStore((s) => s.tempMaxValues);
  const hasHydrated = useTrainingStore((s) => s._hasHydrated);

  const {
    saveExerciseAndBranchData,
    saveRepsInput,
    handleFeedback,
    handleExerciseSkipped,
  } = useExerciseCompletion();
  const { finishTraining } = useFinishTraining();

  const [repsDraft, setRepsDraft] = useState<Record<number, number>>({});

  // Deep-link/flag-flip guard: this screen only exists behind the flag.
  useEffect(() => {
    if (!featureFlags.trainingListViewEnabled) {
      router.replace("/training/training-overview");
    }
  }, [router]);

  const rows = useMemo(() => {
    if (!exerciseList) return [];

    return exerciseList.reduce<ListRow[]>((acc, exercise, index) => {
      if (checkIsPauseExercise(exercise.exerciseId)) return acc;

      const exerciseData = getExerciseById(exercise.exerciseId);

      const isTest = exercise.repetition === -1;
      const isLastInSet = exercise.set?.[0] === exercise.set?.[1];
      const isFeedbackSkill = isFeedbackEligibleSkill(
        activeTraining,
        exercise.skill,
      );

      const setLabel =
        exercise.set && exercise.set[1] > 1
          ? t("training.active.set", {
              current: exercise.set[0],
              total: exercise.set[1],
            })
          : undefined;

      acc.push({
        index,
        exerciseId: exercise.exerciseId,
        displayName:
          exerciseData?.displayName ??
          exerciseData?.name ??
          exercise.exerciseId,
        setLabel,
        isTest,
        isLastInSet,
        isFeedbackSkill,
      });
      return acc;
    }, []);
  }, [exerciseList, activeTraining, t]);

  // All visible rows completed -> enable the finish button, mirroring the
  // last exercise in the sequential flow, but requiring an explicit tap
  // instead of auto-navigating.
  const allCompleted =
    rows.length > 0 &&
    getIncompleteCount(
      rows.map((row) => row.index),
      completedExerciseIndices,
    ) === 0;

  const handleFinish = () => {
    finishTraining(false, tempMaxValues);
  };

  const handleComplete = (
    row: ListRow,
    feedback?: TrainingListItemFeedback,
  ) => {
    if (completedExerciseIndices.includes(row.index)) return;

    if (row.isLastInSet && !row.isTest) {
      handleFeedback(row.index, feedback ?? "SUCCEEDED");
    }
    saveExerciseAndBranchData(row.index);
    markExerciseCompleted(row.index);
  };

  const handleSkip = (row: ListRow) => {
    if (completedExerciseIndices.includes(row.index)) return;

    handleExerciseSkipped(row.index);
    saveExerciseAndBranchData(row.index);
    markExerciseCompleted(row.index);
  };

  const handleSubmitReps = (row: ListRow) => {
    if (completedExerciseIndices.includes(row.index)) return;

    saveRepsInput(row.index, repsDraft[row.index] ?? 0);
    saveExerciseAndBranchData(row.index);
    markExerciseCompleted(row.index);
  };

  const handleShowInfo = (exerciseId: string) => {
    router.push({
      pathname: "/training/exercise-information",
      params: { exerciseId },
    });
  };

  const handleAbort = useCallback(() => {
    Alert.alert(
      t("training.active.abort.question"),
      t("training.active.abort.explanation"),
      [
        {
          text: t("common.yes"),
          onPress: () => finishTraining(true),
        },
        {
          text: t("common.no"),
        },
      ],
    );
  }, [finishTraining, t]);

  // Handle back button - prevent accidental exit, mirroring training-active.tsx
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          handleAbort();
          return true;
        },
      );

      return () => subscription.remove();
    }, [handleAbort]),
  );

  if (!featureFlags.trainingListViewEnabled) {
    return null;
  }

  if (!hasHydrated || !exerciseList || exerciseList.length === 0) {
    return (
      <Box
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="l"
        backgroundColor="white"
      >
        <Text variant="title">{t("common.loading")}</Text>
      </Box>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("training.list.title"),
          headerBackVisible: false,
          headerRight: () => (
            <TouchableBox
              onPress={handleAbort}
              key="abort_training"
              minWidth={36}
              minHeight={36}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicon name="close-circle" size={28} color={colors.black} />
            </TouchableBox>
          ),
        }}
      />
      <Box
        flex={1}
        backgroundColor="white"
        style={{ paddingBottom: insets.bottom }}
      >
        <ScrollView>
          <Box padding="l">
            {rows.map((row) => (
              <TrainingListItem
                key={row.index}
                testId={`training-list-row-${row.index}`}
                displayName={row.displayName}
                setLabel={row.setLabel}
                isTest={row.isTest}
                isFeedbackEligible={row.isFeedbackSkill && row.isLastInSet}
                isCompleted={completedExerciseIndices.includes(row.index)}
                completedFeedback={
                  exerciseList?.[row.index]?.feedback?.difficulty
                }
                repsValue={repsDraft[row.index] ?? 0}
                onChangeReps={(value) => {
                  const num = Number.parseInt(value) || 0;
                  setRepsDraft((prev) => ({ ...prev, [row.index]: num }));
                }}
                onSubmitReps={() => handleSubmitReps(row)}
                onComplete={(feedback) => handleComplete(row, feedback)}
                onSkip={() => handleSkip(row)}
                onShowInfo={() => handleShowInfo(row.exerciseId)}
              />
            ))}
          </Box>
        </ScrollView>
        <Box
          paddingHorizontal="l"
          paddingVertical="m"
          borderTopWidth={1}
          borderTopColor="lightGrey1"
        >
          <Button
            onPress={handleFinish}
            disabled={!allCompleted}
            style={{ opacity: allCompleted ? 1 : 0.5 }}
            testID="training-list-finish-button"
          >
            {t("training.list.finishTraining")}
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default TrainingList;
