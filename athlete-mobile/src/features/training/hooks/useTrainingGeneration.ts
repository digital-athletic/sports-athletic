import { Alert } from "@/common/Alert";
import {
  CardioTypes,
  FocusType,
  PlaceType,
  SectionTypes,
} from "@/constants/workoutConstants";
import { getAllExercises } from "@/data/exerciseRegistry";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isGeneratorError } from "@/features/training/generators/GeneratorError";
import { buildGeneratorErrorMessage } from "@/features/training/generators/generatorErrorUtils";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
import { useTrainingAlerts } from "@/features/training/hooks/useTrainingAlerts";
import { TrainingType } from "@/features/training/models/Training";
import { type TrainingDayType } from "@/features/training/models/TrainingDay";
import { useTrainingStore } from "@/features/training/trainingStore";
import { maintainBranchLevels } from "@/features/training/utils/branchMaintenance";
import { shouldShowPainAlert } from "@/features/training/utils/painUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import { daysSinceLastTraining } from "@/features/training/utils/trainingGapUtils";
import { toUserExerciseDataList } from "@/schemas/generator.schema";
import { type UserType, parseUserType } from "@/schemas/user.schema";
import { Logger } from "@/services/Logger";
import { useAuthStore } from "@/store/authStore";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { parseBooleanParam, parseIntParam } from "@/utils/router";
import { useRouter } from "expo-router";
import { type TFunction } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export type TrainingGenerationParams = {
  type: TrainingType;
  weekday?: string;
  sectionIndex?: string;
  originPath?: string;
  sectionType?: SectionTypes;
  sectionCardioType?: CardioTypes;
  trainingFocus?: FocusType;
  test?: string;
  user?: string; // User persona as JSON string
};

/** The soreness blocker points users to focus and prevention trainings, so those skip the check. */
export const checksSoreness = (type: TrainingType) =>
  type === "PLAN" || type === "TEST_WORKOUT";

type GenerationContext = {
  trainingDays: TrainingDayType[];
  places: ReturnType<typeof usePlacesStore.getState>["places"];
  workoutsList: ReturnType<
    typeof useCompletedWorkoutsStore.getState
  >["workoutsList"];
  userId: string | undefined;
  personalData: ReturnType<typeof useUserProfileStore.getState>["personalData"];
  workoutData: ReturnType<typeof useUserWorkoutStore.getState>["workoutData"];
  temporalData: ReturnType<typeof useUserWorkoutStore.getState>["temporalData"];
  trainingPlan: ReturnType<typeof useUserWorkoutStore.getState>["trainingPlan"];
  exercises: ReturnType<typeof getAllExercises>;
  skillTrees: ReturnType<typeof getAllSkillTrees>;
  exerciseData: ReturnType<
    typeof useExerciseProgressStore.getState
  >["exerciseData"];
  branchData: ReturnType<
    typeof useExerciseProgressStore.getState
  >["branchData"];
  setBranchData: ReturnType<
    typeof useExerciseProgressStore.getState
  >["setBranchData"];
  clearTraining: ReturnType<typeof useTrainingStore.getState>["clearTraining"];
  setExerciseList: ReturnType<
    typeof useTrainingStore.getState
  >["setExerciseList"];
  setEquipment: ReturnType<typeof useTrainingStore.getState>["setEquipment"];
  setActiveTraining: ReturnType<
    typeof useTrainingStore.getState
  >["setActiveTraining"];
};

function resolveSelectedPlace(
  trainingType: TrainingType,
  fallbackPlace: PlaceType,
  weekdayNumber: number | undefined,
  trainingDays: TrainingDayType[],
): PlaceType {
  if (trainingType !== "PLAN" || weekdayNumber === undefined) {
    return fallbackPlace;
  }
  return trainingDays[weekdayNumber]?.place ?? fallbackPlace;
}

function resolveUser(
  baseUser: UserType,
  testParam: string | undefined,
  userParam: string | undefined,
): UserType {
  if (!parseBooleanParam(testParam) || !userParam) {
    return baseUser;
  }
  try {
    const parsed = JSON.parse(userParam);
    const validated = parseUserType(parsed);
    if (validated.success) {
      return validated.data as UserType;
    }
    Logger.logError(new Error(validated.error));
  } catch (e) {
    if (e instanceof Error) {
      Logger.logError(e);
    }
  }
  return baseUser;
}

function buildUser(
  params: TrainingGenerationParams,
  ctx: GenerationContext,
): UserType {
  const baseUser: UserType = {
    userId: ctx.userId ?? "test-user",
    personalData: ctx.personalData,
    workoutData: ctx.workoutData,
    // Soreness from an earlier training must not block a type that skips the check.
    temporalData: checksSoreness(params.type) ? (ctx.temporalData ?? []) : [],
    trainingPlan: ctx.trainingPlan,
  };
  return resolveUser(baseUser, params.test, params.user);
}

function calculateDaysSinceLastWorkout(
  trainingType: TrainingType,
  ctx: GenerationContext,
): number {
  if (trainingType !== "PLAN" || !ctx.trainingPlan) {
    return 0;
  }
  return daysSinceLastTraining(
    ctx.workoutsList.map((workout) => workout.timestamp),
    ctx.trainingPlan,
    new Date(),
  );
}

/** Reconciles and decays the stored branch levels once per generation and persists the result. */
function maintainStoredBranchLevels(
  user: UserType,
  ctx: GenerationContext,
): GenerationContext["branchData"] {
  const timestamps = ctx.workoutsList.map((workout) => workout.timestamp);
  const branchData = maintainBranchLevels({
    branchData: ctx.branchData,
    branches: Object.assign({}, ...Object.values(ctx.skillTrees)),
    fitnessLevel: getUserLevel(user),
    lastSessionAt: timestamps.length > 0 ? Math.max(...timestamps) : null,
    now: Date.now(),
  });
  if (branchData !== ctx.branchData) {
    ctx.setBranchData(branchData);
  }
  return branchData;
}

type GeneratedTrainingMeta = {
  trainingType: TrainingType;
  sectionIndex: number | undefined;
  weekdayNumber: number | undefined;
  equipment: Parameters<GenerationContext["setEquipment"]>[0];
};

function saveGeneratedTraining(
  generatedList: Parameters<typeof toUserExerciseDataList>[0],
  meta: GeneratedTrainingMeta,
  params: TrainingGenerationParams,
  ctx: GenerationContext,
) {
  // Stale session state from a killed workout must not leak into the new
  // session. clearTraining preserves `selection`, so the user's training
  // selection is unaffected.
  ctx.clearTraining();
  const exerciseList = toUserExerciseDataList(generatedList);
  ctx.setExerciseList(exerciseList);
  ctx.setEquipment(meta.equipment);
  ctx.setActiveTraining({
    id: `workout-${Date.now()}`,
    type: meta.trainingType,
    sectionIndex: meta.sectionIndex,
    weekday: meta.weekdayNumber,
    sectionType: params.sectionType,
    sectionCardioType: params.sectionCardioType,
    trainingFocus: params.trainingFocus,
  });
  return exerciseList;
}

function generateExerciseList(
  place: PlaceType,
  params: TrainingGenerationParams,
  ctx: GenerationContext,
) {
  const trainingType = params.type;
  const weekdayNumber = parseIntParam(params.weekday);
  const selectedPlace = resolveSelectedPlace(
    trainingType,
    place,
    weekdayNumber,
    ctx.trainingDays,
  );
  const equipment = ctx.places[selectedPlace]?.equipment ?? [];
  const user = buildUser(params, ctx);

  const daysSinceLastWorkout = calculateDaysSinceLastWorkout(trainingType, ctx);
  const sectionIndex = parseIntParam(params.sectionIndex);
  const branchData = maintainStoredBranchLevels(user, ctx);

  const tg = new TrainingGenerator();
  const generatedList = tg.generateTraining(
    trainingType,
    user,
    selectedPlace,
    ctx.exercises,
    ctx.skillTrees,
    weekdayNumber ?? 0,
    equipment,
    sectionIndex,
    daysSinceLastWorkout,
    { exerciseData: ctx.exerciseData, branchData },
  );

  return saveGeneratedTraining(
    generatedList,
    { trainingType, sectionIndex, weekdayNumber, equipment },
    params,
    ctx,
  );
}

function showGenerationError(e: unknown, t: TFunction, onDismiss: () => void) {
  let message = t("common.error");

  if (isGeneratorError(e)) {
    message = buildGeneratorErrorMessage(e, t);
    Logger.logError(new Error(message));
  } else if (e instanceof Error) {
    Logger.logError(e);
  }

  Alert.alert(t("training.generator.errorTitleGenerator"), message, [
    { text: t("common.ok"), onPress: onDismiss },
  ]);
}

function useGenerationContext(): GenerationContext {
  const skillTrees = getAllSkillTrees();
  const exercises = getAllExercises();
  const { branchData, exerciseData, setBranchData } =
    useExerciseProgressStore();
  const { trainingDays } = useTrainingScheduleStore();
  const { places } = usePlacesStore();
  const { workoutsList } = useCompletedWorkoutsStore();
  const { setExerciseList, setEquipment, setActiveTraining, clearTraining } =
    useTrainingStore();
  const { auth } = useAuthStore();
  const { personalData } = useUserProfileStore();
  const { workoutData, temporalData, trainingPlan } = useUserWorkoutStore();

  return {
    trainingDays,
    places,
    workoutsList,
    userId: auth?.userId,
    personalData,
    workoutData,
    temporalData,
    trainingPlan,
    exercises,
    skillTrees,
    exerciseData,
    branchData,
    setBranchData,
    clearTraining,
    setExerciseList,
    setEquipment,
    setActiveTraining,
  };
}

/**
 * Builds an exercise list from onboarding/store data and navigates to the
 * training overview, showing the pain alert first when it applies. Extracted
 * from the muscle-soreness screen: this is training-generation domain logic,
 * not screen-specific UI wiring.
 */
export function useTrainingGeneration(params: TrainingGenerationParams) {
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { showPainAlert } = useTrainingAlerts();
  const context = useGenerationContext();

  const generateTraining = (place: PlaceType) => {
    setGenerating(true);

    try {
      const exerciseList = generateExerciseList(place, params, context);

      const startTraining = () => {
        router.navigate({
          pathname: "/training/training-overview",
          params: { ...params, place },
        });
        setGenerating(false);
      };

      if (
        shouldShowPainAlert(params.type, exerciseList, context.workoutData.tags)
      ) {
        showPainAlert(startTraining);
      } else {
        startTraining();
      }
    } catch (e) {
      showGenerationError(e, t, () => {
        setGenerating(false);
        router.replace("/(tabs)/(home)");
      });
    }
  };

  return { generating, generateTraining };
}
