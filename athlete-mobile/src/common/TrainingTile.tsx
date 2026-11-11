import { LinearGradient } from "expo-linear-gradient";
import { type FC } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
} from "react-native";

import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";

const SHADE = ["transparent", "rgba(0, 0, 0, 0.75)"] as const;

export type TrainingTileSize = "full" | "half";

interface TrainingTileProps {
  title: string;
  description?: string;
  /** Photo of the tile. Without it the tile shows the icon on brand red. */
  image?: ImageSourcePropType;
  icon?: AppIconSource;
  size: TrainingTileSize;
  onPress: () => void;
  testID?: string;
}

type TileBackgroundProps = Pick<TrainingTileProps, "image" | "icon" | "size">;

/** The photo under a dark shade, or the large icon on brand red. */
const TileBackground: FC<TileBackgroundProps> = ({ image, icon, size }) => {
  const { colors } = useTheme();

  if (image) {
    return (
      <>
        <Image
          source={image}
          style={styles.fill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <LinearGradient colors={SHADE} style={styles.shade} />
      </>
    );
  }

  return (
    <>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      />
      {icon && (
        <Box style={StyleSheet.absoluteFill} alignItems="center" paddingTop="l">
          <AppIcon
            icon={icon}
            size={size === "full" ? 64 : 48}
            color={colors.white}
            decorative
          />
        </Box>
      )}
    </>
  );
};

/** Tile that opens a training, with a photo or a large icon behind its title. */
export const TrainingTile: FC<TrainingTileProps> = ({
  title,
  description,
  image,
  icon,
  size,
  onPress,
  testID,
}) => {
  const accessibilityLabel = description ? `${title}, ${description}` : title;

  return (
    <Pressable
      onPress={onPress}
      style={size === "full" ? styles.full : styles.half}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Box flex={1} borderRadius="xl" overflow="hidden">
        <TileBackground image={image} icon={icon} size={size} />
        <Box flex={1} justifyContent="flex-end" padding="m">
          {/* Long German compounds carry soft hyphens in the translation, so
              they break between syllables in a half width tile. */}
          <Text
            variant="body"
            fontSize={17}
            fontWeight="700"
            color="white"
            android_hyphenationFrequency="normal"
          >
            {title}
          </Text>
          {description && (
            <Text variant="small" fontSize={13} color="white">
              {description}
            </Text>
          )}
        </Box>
      </Box>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  full: {
    width: "100%",
    height: 170,
  },
  half: {
    width: "48%",
    aspectRatio: 1.1,
  },
  // Explicit size: on web a bundled image renders at its pixel size otherwise.
  fill: {
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
