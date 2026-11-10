import { MuscleSorenessSelector } from "@/bodyParts/MuscleSorenessSelector";
import { MuscleType } from "@/bodyParts/types";
import { BackHeader } from "@/common/BackHeader";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { Loading } from "@/common/Loading";
import { PlaceSelection } from "@/features/equipment/PlaceSelection";
import {
  checksSoreness,
  type TrainingGenerationParams,
  useTrainingGeneration,
} from "@/features/training/hooks/useTrainingGeneration";
import { type TrainingType } from "@/features/training/models/Training";
import {
  dropExpiredMarks,
  updateSorenessMarks,
} from "@/features/training/utils/sorenessMarks";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { usePlacesStore } from "@/store/placesStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Card } from "@/theme/Card";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler } from "react-native";

type ScreenState = "SORENESS" | "PLACE";

const screenStateFor = (type: TrainingType): ScreenState =>
  checksSoreness(type) ? "SORENESS" : "PLACE";

const titleKeyFor = (screenState: ScreenState) =>
  screenState === "SORENESS"
    ? "training.muscleSoreness.title"
    : "training.muscleSoreness.placeAndEquipment";

const dropStoredExpiredMarks = () => {
  const { temporalData, setTemporalData } = useUserWorkoutStore.getState();
  if (temporalData) {
    setTemporalData(dropExpiredMarks(temporalData, Date.now()));
  }
};

/**
 * Muscle Soreness Screen
 *
 * User reports muscle soreness before training.
 * Legacy: views/training/MuscleSoreness
 */
export default function MuscleSorenessScreen() {
  const params = useLocalSearchParams<
    "/training/muscle-soreness",
    TrainingGenerationParams
  >();
  const router = useRouter();

  const { t } = useTranslation();

  const screenState = screenStateFor(params.type);

  const hasDroppedExpiredMarksRef = useRef<true | null>(null);
  if (hasDroppedExpiredMarksRef.current == null) {
    hasDroppedExpiredMarksRef.current = true;
    dropStoredExpiredMarks();
  }

  const { places } = usePlacesStore();
  const { temporalData, setTemporalData } = useUserWorkoutStore();
  const muscleTags =
    temporalData?.map<MuscleType>((data) => data.tag as MuscleType) ?? [];

  const { generating, generateTraining } = useTrainingGeneration(params);
  // Generation reads imported templates, so it waits until their store has hydrated.
  const customWorkoutsHydrated = useCustomWorkoutsStore(
    (state) => state._hasHydrated,
  );

  const handleBack = useCallback(() => {
    router.back();
    return true;
  }, [router]);

  useEffect(() => {
    const handler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBack,
    );
    return () => handler.remove();
  }, [handleBack]);

  const setMuscles = (tags: string[]) => {
    setTemporalData(updateSorenessMarks(temporalData ?? [], tags, Date.now()));
  };

  const title = t(titleKeyFor(screenState));
  const isLoading = generating || !customWorkoutsHydrated;

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title,
            headerLeft: () => <BackHeader onBack={handleBack} />,
          }}
        />
        <Loading show text={t("training.muscleSoreness.loading")} />
      </>
    );
  }

  if (screenState === "PLACE") {
    return (
      <HeadlineScreen
        title={title}
        eyebrow={t("training.muscleSoreness.placeAndEquipment")}
        heading={t("training.muscleSoreness.placeHeading")}
        description={t("training.muscleSoreness.placeDescription")}
        onBack={handleBack}
      >
        <Card variant="outlined" overflow="hidden">
          <PlaceSelection selectPlace={generateTraining} places={places} />
        </Card>
      </HeadlineScreen>
    );
  }

  return (
    <HeadlineScreen
      title={title}
      eyebrow={t("training.muscleSoreness.eyebrow")}
      heading={t("training.muscleSoreness.heading")}
      description={t("training.muscleSoreness.description")}
      onBack={handleBack}
      action={{
        label: t("training.muscleSoreness.continue"),
        onPress: () => generateTraining("STUDIO"),
      }}
    >
      <MuscleSorenessSelector tags={muscleTags} onChange={setMuscles} />
    </HeadlineScreen>
  );
}
