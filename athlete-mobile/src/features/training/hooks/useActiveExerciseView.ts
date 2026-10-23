import { getExerciseById } from "@/data/exerciseRegistry";
import { lookupTemplateName } from "@/features/customWorkouts/lookupTemplate";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  deriveActiveExerciseIndex,
  isFeedbackEligibleSkill,
} from "@/features/training/utils/exerciseDataUtils";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { type ActiveTrainingType } from "@/features/training/models/ActiveTraining";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import {
  type CustomWorkoutsState,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";

function deriveHeaderTitle(
  type: string | undefined,
  t: TFunction,
  language: string | undefined,
  workoutsById: CustomWorkoutsState["workoutsById"],
): string {
  if (!type) {
    return t("training.active.title.plan");
  }

  // Strength test
  if (type === "TEST_WORKOUT") {
    return t("training.active.title.strengthTest");
  }

  return (
    lookupTemplateName(type, language, workoutsById) ??
    t("training.active.title.plan")
  );
}

/**
 * The entry the sequential flow would land on if `safeExerciseIndex` were
 * marked completed right now. Reuses `deriveActiveExerciseIndex` so a stale
 * pause is skipped the same way, instead of naively reading index + 1.
 */
function deriveNextExercise(
  exerciseList: UserExerciseDataType[] | null,
  safeExerciseIndex: number,
) {
  const hasNextExercise =
    exerciseList?.some(
      (exercise, index) => index !== safeExerciseIndex && !exercise.completed,
    ) ?? false;
  const nextExerciseIndex = hasNextExercise
    ? deriveActiveExerciseIndex(exerciseList, safeExerciseIndex)
    : -1;
  const nextExercise = hasNextExercise
    ? exerciseList?.[nextExerciseIndex]
    : undefined;
  const isNextExercisePause = nextExercise
    ? checkIsPauseExercise(nextExercise.exerciseId)
    : false;
  const nextExerciseData = nextExercise
    ? getExerciseById(nextExercise.exerciseId)
    : undefined;

  return {
    hasNextExercise,
    nextExercise,
    isNextExercisePause,
    nextExerciseData,
  };
}

function buildActiveExerciseView(
  exerciseList: UserExerciseDataType[] | null,
  activeTraining: ActiveTrainingType | null,
  t: TFunction,
  language: string | undefined,
  workoutsById: CustomWorkoutsState["workoutsById"],
) {
  const headerTitle = deriveHeaderTitle(
    activeTraining?.type,
    t,
    language,
    workoutsById,
  );

  // Derived from each entry's `completed` mark rather than a stored pointer,
  // so it's always in bounds and always reflects the latest completion state.
  const safeExerciseIndex = deriveActiveExerciseIndex(exerciseList);
  const currentExercise = exerciseList?.[safeExerciseIndex];
  const exerciseId = currentExercise?.exerciseId ?? "-1";
  const isPauseExercise = checkIsPauseExercise(exerciseId);
  const currentExerciseData = getExerciseById(exerciseId);

  const {
    hasNextExercise,
    nextExercise,
    isNextExercisePause,
    nextExerciseData,
  } = deriveNextExercise(exerciseList, safeExerciseIndex);

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

/**
 * Pure, store-derived view of the current/next exercise for the active training
 * screen: current/next exercise + registry data, display flags, name/video, header
 * title and progress.
 */
export function useActiveExerciseView() {
  const { t, i18n } = useTranslation();
  const { exerciseList, activeTraining } = useTrainingStore();
  // Subscribed so the imported title appears once the store finishes hydrating.
  const workoutsById = useCustomWorkoutsStore((state) => state.workoutsById);
  const language = i18n.resolvedLanguage;

  return buildActiveExerciseView(
    exerciseList,
    activeTraining,
    t,
    language,
    workoutsById,
  );
}
