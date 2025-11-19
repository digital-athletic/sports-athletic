import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler } from "react-native";

import { WorkoutConstants } from "@/constants/workoutConstants";
import { SportListItem } from "@/features/anamnesis/SportListItem";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ViewWithTitle } from "../../src/common/ViewWithTitle";

export default function SportScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ originPath?: string }>();
  const originPath = params.originPath;

  const { workoutData, setSport } = useUserWorkoutStore();
  const { isInInitialAnamnesis, setIsInInitialAnamnesis } =
    useUserProfileStore();

  const currentSport = workoutData.sport;

  const back = useCallback(() => {
    if (isInInitialAnamnesis) {
      router.replace("/(tabs)");
      setIsInInitialAnamnesis(false);
    } else if (originPath) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [isInInitialAnamnesis, originPath, setIsInInitialAnamnesis]);

  const showClosePopup = useCallback(() => {
    const message = t("screens.sport.abortAnamnesisIncomplete");

    Alert.alert(t("screens.sport.abortAnamnesisQuestion"), message, [
      {
        text: t("screens.sport.yes"),
        onPress: () => back(),
      },
      {
        text: t("screens.sport.no"),
      },
    ]);
  }, [t, back]);

  const handleBackPress = useCallback(() => {
    if (originPath === "Welcome") {
      return true; // Block back to welcome
    } else {
      showClosePopup();
      return true;
    }
  }, [originPath, showClosePopup]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => subscription.remove();
  }, [handleBackPress]);

  const goOn = () => {
    router.push({
      pathname: "/anamnesis/userprofile",
      params: { originPath: "Sport" },
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
        <SportListItem
          key={sportKey}
          sportKey={sportKey}
          isSelected={isSelected}
          onPress={() => selectSport(sportKey)}
        />
      );
    });
  };

  return (
    <>
      <Stack.Screen />
      <Box flex={1} backgroundColor="lightGrey1">
        <Box flex={10}>
          <ViewWithTitle
            title={t("screens.sport.title")}
            fixed={false}
            onBack={originPath === "Welcome" ? showClosePopup : back}
            onClose={originPath === "Welcome" ? showClosePopup : undefined}
          >
            <Box>{renderSports()}</Box>
          </ViewWithTitle>
        </Box>
        {originPath === "Welcome" && (
          <Button onPress={goOn}>{t("screens.sport.goOn")}</Button>
        )}
      </Box>
    </>
  );
}
