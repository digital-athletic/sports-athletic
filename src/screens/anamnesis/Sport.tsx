import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  BackHandler,
  Image,
  StyleSheet,
  TouchableOpacity,
  type ImageSourcePropType,
} from "react-native";

import { WorkoutConstants } from "@/constants/workoutConstants";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { ViewWithTitle } from "../../common/ViewWithTitle";

interface SportListItemProps {
  sportKey: keyof typeof WorkoutConstants.SPORTS;
  isSelected: boolean;
  onPress: () => void;
}

const SportListItem: FC<SportListItemProps> = ({
  sportKey,
  isSelected,
  onPress,
}) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.listItem}
      accessibilityLabel={`sport-item-${sportKey}`}
      accessibilityRole="button"
    >
      <Image
        source={
          WorkoutConstants.SPORTS_IMAGES[
            sportKey as keyof typeof WorkoutConstants.SPORTS_IMAGES
          ] as ImageSourcePropType
        }
        style={styles.listImage}
        resizeMode="cover"
        accessibilityLabel={t(`sports.${sportKey}`)}
      />
      <Box style={styles.listContent}>
        <Text variant="cardTitle" color="darkGrey3">
          {t(`sports.${sportKey}`)}
        </Text>
        {isSelected && (
          <Text variant="body" color="primary" paddingTop="xs">
            {t("screens.sport.sportSelected")}
          </Text>
        )}
      </Box>
    </TouchableOpacity>
  );
};

export const Sport: FC = () => {
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
        <TouchableOpacity
          onPress={goOn}
          style={styles.button}
          accessibilityLabel="sport-go-on-button"
          accessibilityRole="button"
        >
          <Text color="white" variant="button">
            {t("screens.sport.goOn")}
          </Text>
        </TouchableOpacity>
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  listItem: {
    position: "relative",
    width: "100%",
    height: 100,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  listImage: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 100,
    width: 100,
  },
  listContent: {
    marginLeft: 100,
    padding: 15,
  },
  button: {
    backgroundColor: "#0066CC",
    borderColor: "#0066CC",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    margin: 15,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
  },
});
