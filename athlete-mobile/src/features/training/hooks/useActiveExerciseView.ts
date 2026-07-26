import { isSkillTypes } from "@/constants/workoutConstants";
import { getExerciseById } from "@/data/exerciseRegistry";
import { useTrainingStore } from "@/features/training/trainingStore";
import { isFeedbackEligibleSkill } from "@/features/training/utils/exerciseDataUtils";
import { isPreventionSkill } from "@/features/training/utils/skillTreeUtils";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";

function deriveHeaderTitle(type: string | undefined, t: TFunction): string {
  if (!type) {
    return t("training.active.title.plan");
  }

  // Strength test
  if (type === "TEST_WORKOUT") {
    return t("training.active.title.strengthTest");
  }

  // Focus or Prevention training
  if (isSkillTypes(type)) {
    return t(`training.skill.${type}`, {
      defaultValue: isPreventionSkill(type)
        ? t("training.active.title.prevention")
        : t("training.active.title.focus"),
    });
  }

  return t("training.active.title.plan");
}

/**
 * Pure, store-derived view of the current/next exercise for the active training
 * screen: current/next exercise + registry data, display flags, name/video, header
 * title and progress.
 */
export function useActiveExerciseView() {
  const { t } = useTranslation();
  const { exerciseList, activeExerciseIndex, activeTraining } =
    useTrainingStore();

  const headerTitle = deriveHeaderTitle(activeTraining?.type, t);

  // Clamp guards against a persisted index that exceeds the current exercise list length
  // (e.g. after a workout is regenerated with fewer exercises).
  const safeExerciseIndex = Math.min(
    activeExerciseIndex,
    (exerciseList?.length ?? 1) - 1,
  );
  const currentExercise = exerciseList?.[safeExerciseIndex];
  const exerciseId = currentExercise?.exerciseId ?? "-1";
  const isPauseExercise = checkIsPauseExercise(exerciseId);
  const currentExerciseData = getExerciseById(exerciseId);

  const nextExerciseIndex = safeExerciseIndex + 1;
  const hasNextExercise = nextExerciseIndex < (exerciseList?.length ?? 0);
  const nextExercise = hasNextExercise
    ? exerciseList?.[nextExerciseIndex]
    : undefined;
  const isNextExercisePause = nextExercise
    ? checkIsPauseExercise(nextExercise.exerciseId)
    : false;
  const nextExerciseData = nextExercise
    ? getExerciseById(nextExercise.exerciseId)
    : undefined;

  const progress = safeExerciseIndex / (exerciseList?.length ?? 1);
  const isTestExercise = currentExercise?.repetition === -1;
  const isCardioExercise = currentExercise?.skill?.includes("CARDIO") ?? false;
  // Endurance exercises show a checkmark instead of a countdown timer. This app focuses on
  // strength training, so we defer detailed endurance tracking to dedicated apps.
  const isEnduranceExercise =
    currentExercise?.skill === "CARDIO_4" ||
    currentExercise?.skill === "CARDIO_5";
  const isLastInSet = currentExercise?.set?.[0] === currentExercise?.set?.[1];

  // During a pause exercise the screen displays the upcoming exercise instead.
  const displayExerciseId = isPauseExercise
    ? nextExercise?.exerciseId
    : exerciseId;
  const displayExerciseData = isPauseExercise
    ? nextExerciseData
    : currentExerciseData;

  const name = displayExerciseData?.displayName ?? displayExerciseData?.name;
  const video = displayExerciseData?.video;

  const isFeedbackSkill = currentExercise
    ? isFeedbackEligibleSkill(activeTraining, currentExercise.skill)
    : false;

  return {
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
      isNextExercisePause,
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
  };
}
