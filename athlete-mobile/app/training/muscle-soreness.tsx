import { MuscleSorenessSelector } from "@/bodyParts/MuscleSorenessSelector";
import { MuscleType } from "@/bodyParts/types";
import { BackHeader } from "@/common/BackHeader";
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
import { usePlacesStore } from "@/store/placesStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { useTheme } from "@/theme/theme";
import { Text } from "@/theme/Text";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenState = "SORENESS" | "PLACE";

const screenStateFor = (type: TrainingType): ScreenState =>
  checksSoreness(type) ? "SORENESS" : "PLACE";

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
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();

  const screenState = screenStateFor(params.type);

  const hasDroppedExpiredMarksRef = useRef(false);
  if (!hasDroppedExpiredMarksRef.current) {
    hasDroppedExpiredMarksRef.current = true;
    const { temporalData: stored, setTemporalData: save } =
      useUserWorkoutStore.getState();
    if (stored) {
      save(dropExpiredMarks(stored, Date.now()));
    }
  }

  const { places } = usePlacesStore();
  const { temporalData, setTemporalData } = useUserWorkoutStore();
  const muscleTags =
    temporalData?.map<MuscleType>((data) => data.tag as MuscleType) ?? [];

  const { generating, generateTraining } = useTrainingGeneration(params);

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

  let title =
    screenState === "SORENESS"
      ? t("training.muscleSoreness.title")
      : t("training.muscleSoreness.placeAndEquipment");

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerLeft: () => <BackHeader onBack={handleBack} />,
        }}
      />
      <Box
        flex={1}
        justifyContent="center"
        alignItems="stretch"
        paddingVertical="s"
        style={{
          paddingBottom: insets.bottom,
          paddingLeft: Math.max(spacing.m, insets.left),
          paddingRight: Math.max(spacing.m, insets.right),
        }}
      >
        {generating ? (
          <Loading show text={t("training.muscleSoreness.loading")} />
        ) : (
          <>
            <Box flex={1} justifyContent="center" alignItems="stretch">
              {screenState === "SORENESS" ? (
                <Box flex={1}>
                  {params.type === "PLAN" ? (
                    <Text variant="title">
                      {t("training.muscleSoreness.title")}
                    </Text>
                  ) : null}
                  <MuscleSorenessSelector
                    tags={muscleTags}
                    onChange={setMuscles}
                  />
                </Box>
              ) : (
                <ScrollBox
                  contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "center",
                  }}
                >
                  <PlaceSelection
                    selectPlace={generateTraining}
                    places={places}
                  />
                </ScrollBox>
              )}
            </Box>
            {screenState === "SORENESS" ? (
              <Button onPress={() => generateTraining("STUDIO")}>
                {t("training.muscleSoreness.continue")}
              </Button>
            ) : (
              <Box />
            )}
          </>
        )}
      </Box>
    </>
  );
}
