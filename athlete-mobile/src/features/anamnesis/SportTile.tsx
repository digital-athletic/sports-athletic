import { LinearGradient } from "expo-linear-gradient";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
} from "react-native";

import { AppIcon } from "@/common/AppIcon";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import IconCheck from "@tabler/icons-react-native/IconCheck";

const SPORT_IMAGES: Partial<
  Record<keyof typeof WorkoutConstants.SPORTS, ImageSourcePropType>
> = {
  SPORT_HANDBALL: require("../../../assets/img/sportSelection/Handball.png"),
  SPORT_FOOTBALL: require("../../../assets/img/sportSelection/soccer.jpg"),
  SPORT_VOLLEYBALL: require("../../../assets/img/sportSelection/volleyball.jpg"),
  SPORT_BASKETBALL: require("../../../assets/img/sportSelection/basketball.jpg"),
  SPORT_ICE_HOCKEY: require("../../../assets/img/sportSelection/icehockey.jpg"),
  SPORT_HOCKEY: require("../../../assets/img/sportSelection/Hockey.jpg"),
  SPORT_AMERICAN_FOOTBALL: require("../../../assets/img/sportSelection/american-football.jpg"),
  SPORT_RUGBY: require("../../../assets/img/sportSelection/Rugby.jpg"),
  SPORT_OTHER: require("../../../assets/img/sportSelection/generel-athletic.jpg"),
};

const SHADE = ["transparent", "rgba(0, 0, 0, 0.75)"] as const;

interface SportTileProps {
  sportKey: keyof typeof WorkoutConstants.SPORTS;
  isSelected: boolean;
  onPress: () => void;
}

/** Photo tile of one sport. The name sits on a dark shade to stay readable. */
export const SportTile: FC<SportTileProps> = ({
  sportKey,
  isSelected,
  onPress,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const sportName = t(`sports.${sportKey}`);
  const sportImage = SPORT_IMAGES[sportKey];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tile,
        { borderColor: isSelected ? colors.primary : colors.transparent },
      ]}
      accessibilityLabel={sportName}
      accessibilityRole="button"
      // react-native-web 0.21 maps only the aria props, not accessibilityState.
      aria-selected={isSelected}
    >
      <Box
        flex={1}
        borderRadius="l"
        overflow="hidden"
        backgroundColor="darkGrey2"
      >
        {sportImage && (
          <Image
            source={sportImage}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        )}
        <LinearGradient colors={SHADE} style={styles.shade} />
        <Box flex={1} justifyContent="flex-end" padding="s">
          <Text variant="body" fontWeight="700" color="white">
            {sportName}
          </Text>
        </Box>
        {isSelected && (
          <Box
            position="absolute"
            top={8}
            right={8}
            width={28}
            height={28}
            borderRadius="round"
            backgroundColor="primary"
            alignItems="center"
            justifyContent="center"
          >
            <AppIcon
              icon={IconCheck}
              size={18}
              color={colors.white}
              decorative
            />
          </Box>
        )}
      </Box>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: "48%",
    aspectRatio: 1.15,
    padding: 3,
    borderRadius: 18,
    borderWidth: 2.5,
  },
  // Explicit size: on web a bundled image keeps its pixel size otherwise.
  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  shade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
});
