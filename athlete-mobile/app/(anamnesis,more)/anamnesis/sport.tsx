import { RoutePath, router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { SkipHeader } from "@/common/SkipHeader";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { AnamnesisScreen } from "@/features/anamnesis/components/AnamnesisScreen";
import { SportTile } from "@/features/anamnesis/SportTile";
import { useHardwareBackHandler } from "@/hooks/useHardwareBackHandler";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";

export default function SportScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ originPath?: RoutePath }>();
  const originPath = params.originPath;

  const { workoutData, setSport } = useUserWorkoutStore();
  const { anamnesisCompleted } = useUserProfileStore();

  const currentSport = workoutData.sport;

  const back = useCallback(() => {
    if (!anamnesisCompleted) {
      router.replace("/(tabs)/(home)");
    } else if (originPath) {
      router.back();
    } else {
      router.replace("/(tabs)/(home)");
    }
  }, [anamnesisCompleted, originPath]);

  const showClosePopup = useCallback(() => {
    const message = t("screens.sport.abortAnamnesisIncomplete");

    Alert.alert(t("screens.sport.abortAnamnesisQuestion"), message, [
      {
        text: t("common.yes"),
        onPress: () => back(),
      },
      {
        text: t("common.no"),
      },
    ]);
  }, [t, back]);

  const handleHardwareBackPress = useCallback(() => {
    if (originPath === "/(anamnesis)/anamnesis") {
      showClosePopup();
      return true; // Block back to welcome
    }

    return false; // Allow default back behavior
  }, [originPath, showClosePopup]);

  useHardwareBackHandler(handleHardwareBackPress);

  const goOn = () => {
    router.push({
      pathname: "/anamnesis/userprofile",
      params: { originPath: "/anamnesis/sport" satisfies RoutePath },
    });
  };

  const selectSport = (sportKey: keyof typeof WorkoutConstants.SPORTS) => {
    const sportValue = WorkoutConstants.SPORTS[sportKey];
    setSport(sportValue);
  };

  const renderSports = () => {
    return WorkoutConstants.SPORTS_SORTED.map((sportKey) => {
      const sportValue = WorkoutConstants.SPORTS[sportKey];
      const isSelected = sportValue === currentSport;

      return (
        <SportTile
          key={sportKey}
          sportKey={sportKey}
          isSelected={isSelected}
          onPress={() => selectSport(sportKey)}
        />
      );
    });
  };

  const isOnboarding = originPath === "/(anamnesis)/anamnesis";

  return (
    <AnamnesisScreen
      title={t("screens.sport.title")}
      heading={t("screens.sport.question")}
      onBack={isOnboarding ? showClosePopup : back}
      headerRight={
        isOnboarding ? (
          <SkipHeader
            alertTitle="screens.sport.abortAnamnesisQuestion"
            alertMessage="screens.sport.abortAnamnesisIncomplete"
          />
        ) : null
      }
      action={
        isOnboarding
          ? { label: t("screens.sport.goOn"), onPress: goOn }
          : undefined
      }
    >
      <Box
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="space-between"
        rowGap="s"
      >
        {renderSports()}
      </Box>
    </AnamnesisScreen>
  );
}
