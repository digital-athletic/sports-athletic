import { CenteredLoading } from "@/common/CenteredLoading";
import { HeaderIconButton } from "@/common/HeaderIconButton";
import { ExerciseInfoPanel } from "@/features/training/ExerciseInfoPanel";
import {
  FOOTER_HEIGHT,
  TrainingFooter,
} from "@/features/training/TrainingFooter";
import { TrainingNavigation } from "@/features/training/TrainingNavigation";
import { TrainingProgressBar } from "@/features/training/TrainingProgressBar";
import { useActiveExerciseView } from "@/features/training/hooks/useActiveExerciseView";
import { useExerciseProgression } from "@/features/training/hooks/useExerciseProgression";
import { useTrainingActiveLifecycle } from "@/features/training/hooks/useTrainingActiveLifecycle";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { VideoPlayer } from "@/video/VideoPlayer";
import { Stack, useRouter } from "expo-router";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TRAINING_INPUT_OFFSET = 100;

type TrainingActiveProps = Record<string, never>;

/**
 * Active training execution screen - displays exercises, tracks progress.
 * Prevents accidental exits during training via disabled back gestures.
 * Legacy: views/training/Training
 */
const TrainingActive: FC<TrainingActiveProps> = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const {
    exerciseList,
    safeExerciseIndex,
    currentExercise,
    exerciseId,
    currentExerciseData,
    nextExercise,
    nextExerciseData,
    hasNextExercise,
    displayExerciseId,
    flags: {
      isPauseExercise,
      isCardioExercise,
      isEnduranceExercise,
      isTestExercise,
      isLastInSet,
      isFeedbackSkill,
    },
    name,
    video,
    headerTitle,
    progress,
  } = useActiveExerciseView();
  const { personalData } = useUserProfileStore();
  const { workoutData } = useUserWorkoutStore();
  const {
    isSkipped,
    isAborted,
    advanceToNextExercise,
    handleExerciseSkipped,
    handleFeedback,
    handleAbortTraining,
    handlePauseToggled,
    saveRepsForCurrentExercise,
  } = useExerciseProgression();

  // Local state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [footerHeight, setFooterHeight] = useState(FOOTER_HEIGHT);

  const { isScreenFocused } = useTrainingActiveLifecycle({
    onAbort: handleAbortTraining,
  });

  if (!exerciseList || exerciseList.length === 0) {
    return <CenteredLoading />;
  }

  const handleShowExerciseInformation = () => {
    if (!displayExerciseId || displayExerciseId === "-1") {
      return;
    }

    router.navigate({
      pathname: "/training/exercise-information",
      params: {
        exerciseId: displayExerciseId,
      },
    });
  };

  const isCountdownActive =
    isScreenFocused &&
    !isAborted &&
    !videoIsPlaying &&
    !isFullScreen &&
    !isSkipped;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle,
          headerBackVisible: false,
          headerLeft: () => (
            <HeaderIconButton
              iconName="information-circle"
              onPress={handleShowExerciseInformation}
              accessibilityLabel={t("training.active.a11y.showExerciseInfo")}
            />
          ),
          headerRight: () => (
            <HeaderIconButton
              iconName="close-circle"
              onPress={handleAbortTraining}
              accessibilityLabel={t("training.active.a11y.abortTraining")}
            />
          ),
        }}
      />
      <Box
        flex={1}
        style={{
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: colors.white }}
          // Ensures input and save button remain visible
          bottomOffset={TRAINING_INPUT_OFFSET}
          keyboardShouldPersistTaps="handled"
        >
          <Box flex={1} backgroundColor="white" justifyContent="flex-start">
            {/* Progress bar */}
            <TrainingProgressBar progress={progress} />

            {/* Video/Exercise container */}
            <Box backgroundColor="lightGrey2">
              {!!video && (
                <VideoPlayer
                  title={name ?? ""}
                  source={video}
                  setIsFullScreen={setIsFullScreen}
                  setIsVideoPlaying={setVideoIsPlaying}
                  disabled={isAborted || !isScreenFocused}
                />
              )}
            </Box>

            {/* Exercise information */}
            <ExerciseInfoPanel
              exercise={currentExercise}
              exerciseData={currentExerciseData}
              isPauseExercise={isPauseExercise}
              isCardioExercise={isCardioExercise}
              maxValues={workoutData.maxValues}
              birthday={personalData.birthday}
            />

            {/* Training Navigation or Fallback Controls */}
            {currentExercise && (
              <TrainingNavigation
                exerciseId={exerciseId}
                exerciseName={name}
                nextExerciseId={nextExercise?.exerciseId}
                duration={
                  // undefined shows the checkmark, a number starts a countdown.
                  // The athlete tracks long endurance exercises elsewhere, so they
                  // get no timer.
                  isEnduranceExercise ? undefined : currentExercise.duration
                }
                next={advanceToNextExercise}
                feedback={handleFeedback}
                isCountdownActive={isCountdownActive}
                isFirstDurationInTraining={safeExerciseIndex === 0}
                isLastInSet={isLastInSet}
                isFeedbackSkill={isFeedbackSkill && !isEnduranceExercise}
                isCardioExercise={isCardioExercise}
                isLastCardioExercise={isCardioExercise && !hasNextExercise}
                isTest={isTestExercise}
                onSubmitReps={saveRepsForCurrentExercise}
                pauseToggled={handlePauseToggled}
              />
            )}

            {/* Avoids content being hidden behind TrainingFooter */}
            <Box height={footerHeight} />
          </Box>
        </KeyboardAwareScrollView>
        {/* Skip button & next exercise preview */}
        <TrainingFooter
          isSkipHidden={
            isTestExercise && typeof currentExercise?.duration === "undefined"
          }
          nextExerciseName={
            nextExerciseData?.displayName ?? nextExerciseData?.name
          }
          onSkipPress={handleExerciseSkipped}
          onHeightChange={setFooterHeight}
        />
      </Box>
    </>
  );
};

export default TrainingActive;
