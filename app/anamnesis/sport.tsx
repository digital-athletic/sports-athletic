import { Route, Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler } from "react-native";

import { BackHeader } from "@/common/BackHeader";
import { SkipHeader } from "@/common/SkipHeader";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { SportListItem } from "@/features/anamnesis/SportListItem";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SportScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ originPath?: Route }>();
  const originPath = params.originPath;
  const insets = useSafeAreaInsets();

  const { workoutData, setSport } = useUserWorkoutStore();
  const { isInInitialAnamnesis, setIsInInitialAnamnesis } =
    useUserProfileStore();
  const { setOriginPath } = useAnamnesisStore();

  const currentSport = workoutData.sport;

  const back = useCallback(() => {
    if (isInInitialAnamnesis) {
      router.replace("/(tabs)/(home)");
      setIsInInitialAnamnesis(false);
    } else if (originPath) {
      router.back();
    } else {
      router.replace("/(tabs)/(home)");
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
    if (originPath === "/anamnesis") {
      return true; // Block back to welcome
    } else {
      showClosePopup();
      return true;
    }
  }, [originPath, showClosePopup]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );
    return () => subscription.remove();
  }, [handleBackPress]);

  useEffect(() => {
    setOriginPath(originPath);
  }, [originPath, setOriginPath]);

  const goOn = () => {
    router.push({
      pathname: "/anamnesis/userprofile",
      params: { originPath: "/anamnesis/sport" satisfies Route },
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
          title: t("screens.sport.title"),
          headerLeft: () => (
            <BackHeader
              onBack={originPath === "/anamnesis" ? showClosePopup : back}
            />
          ),
          headerRight: () =>
            originPath === "/anamnesis" ? (
              <SkipHeader onSkip={showClosePopup} />
            ) : null,
        }}
      />
      <ScrollBox
        flex={1}
        backgroundColor="lightGrey1"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {renderSports()}
        {originPath === "/anamnesis" && (
          <Button onPress={goOn} margin="m">
            {t("screens.sport.goOn")}
          </Button>
        )}
      </ScrollBox>
    </>
  );
}
