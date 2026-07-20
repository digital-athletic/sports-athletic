import { type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { WorkoutConstants } from "@/constants/workoutConstants";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";

const SPORT_IMAGES: Partial<
  Record<keyof typeof WorkoutConstants.SPORTS, ImageSourcePropType>
> = {
  HANDBALL_SPORT: require("../../../assets/img/sportSelection/Handball.png"),
  FOOTBALL_SPORT: require("../../../assets/img/sportSelection/soccer.jpg"),
  VOLLEYBALL_SPORT: require("../../../assets/img/sportSelection/volleyball.jpg"),
  BASKETBALL_SPORT: require("../../../assets/img/sportSelection/basketball.jpg"),
  ICE_HOCKEY_SPORT: require("../../../assets/img/sportSelection/icehockey.jpg"),
  HOCKEY_SPORT: require("../../../assets/img/sportSelection/Hockey.jpg"),
  AMERICAN_FOOTBALL_SPORT: require("../../../assets/img/sportSelection/american-football.jpg"),
  RUGBY_SPORT: require("../../../assets/img/sportSelection/Rugby.jpg"),
  OTHER_SPORT: require("../../../assets/img/sportSelection/generel-athletic.jpg"),
};

interface SportListItemProps {
  sportKey: keyof typeof WorkoutConstants.SPORTS;
  isSelected: boolean;
  onPress: () => void;
}

export const SportListItem: FC<SportListItemProps> = ({
  sportKey,
  isSelected,
  onPress,
}) => {
  const { t } = useTranslation();
  const sportName = t(`sports.${sportKey}`);
  const sportImage = SPORT_IMAGES[sportKey];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.listItem}
      accessibilityLabel={sportName}
      accessibilityRole="button"
    >
      {sportImage ? (
        <Image
          source={sportImage}
          style={styles.listImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Box
          style={styles.listImage}
          backgroundColor="white"
          borderWidth={1}
          borderColor="lightGrey2"
        />
      )}
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
});
