import { RoutePath, Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { BackHeader } from "@/common/BackHeader";
import { SkipHeader } from "@/common/SkipHeader";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { SportListItem } from "@/features/anamnesis/SportListItem";
import { useHardwareBackHandler } from "@/hooks/useHardwareBackHandler";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SportScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ originPath?: RoutePath }>();
  const originPath = params.originPath;
  const insets = useSafeAreaInsets();

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
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("screens.sport.title"),
          headerLeft: () => (
            <BackHeader
              onBack={
                originPath === "/(anamnesis)/anamnesis" ? showClosePopup : back
              }
            />
          ),
          headerRight: () =>
            originPath === "/(anamnesis)/anamnesis" ? (
              <SkipHeader
                alertTitle="screens.sport.abortAnamnesisQuestion"
                alertMessage="screens.sport.abortAnamnesisIncomplete"
              />
            ) : null,
        }}
      />
      <ScrollBox
        flex={1}
        backgroundColor="lightGrey1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {renderSports()}
        {originPath === "/(anamnesis)/anamnesis" && (
          <Button onPress={goOn} margin="m">
            {t("screens.sport.goOn")}
          </Button>
        )}
      </ScrollBox>
    </>
  );
}
