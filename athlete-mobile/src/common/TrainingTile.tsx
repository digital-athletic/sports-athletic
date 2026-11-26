import { LinearGradient } from "expo-linear-gradient";
import { type FC } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
} from "react-native";

import { type AppIconSource } from "@/common/AppIcon";
import { useTileWidth } from "@/common/TileGrid";
import { TileIcon } from "@/common/TileIcon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";

const SHADE = ["transparent", "rgba(0, 0, 0, 0.75)"] as const;
const ASPECT_RATIO = 1.1;

interface TrainingTileProps {
  title: string;
  description?: string;
  /** Photo of the tile. Without it the tile shows the icon on a grey card. */
  image?: ImageSourcePropType;
  icon?: AppIconSource;
  onPress: () => void;
  testID?: string;
}

/** The photo under a dark shade. */
const TilePhoto: FC<{ image: ImageSourcePropType }> = ({ image }) => (
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

type TileTextProps = Pick<TrainingTileProps, "title" | "description"> & {
  onPhoto: boolean;
};

/** Title and description, white on a photo and grey on a card. */
const TileText: FC<TileTextProps> = ({ title, description, onPhoto }) => (
  <Box>
    {/* Long German compounds carry soft hyphens in the translation, so
        they break between syllables in a narrow tile. */}
    <Text
      variant="body"
      fontSize={17}
      fontWeight="700"
      color={onPhoto ? "white" : "onSurface"}
      android_hyphenationFrequency="normal"
    >
      {title}
    </Text>
    {description && (
      <Text
        variant="small"
        fontSize={13}
        color={onPhoto ? "white" : "onSurfaceVariant"}
      >
        {description}
      </Text>
    )}
  </Box>
);

/**
 * Tile that opens a training, with its title on a photo or below a large icon.
 * An icon tile is at least as tall as a photo tile and grows with its text, so
 * a long German title stays below the icon.
 */
export const TrainingTile: FC<TrainingTileProps> = ({
  title,
  description,
  image,
  icon,
  onPress,
  testID,
}) => {
  const tileWidth = useTileWidth();
  const accessibilityLabel = description ? `${title}, ${description}` : title;

  return (
    <Pressable
      onPress={onPress}
      style={
        image
          ? styles.photoTile
          : [
              styles.iconTile,
              tileWidth !== null && {
                minHeight: Math.round(tileWidth / ASPECT_RATIO),
              },
            ]
      }
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Box
        flex={1}
        borderRadius="xl"
        overflow="hidden"
        backgroundColor={image ? undefined : "surfaceContainerLow"}
        borderColor="outlineVariant"
        borderWidth={image ? 0 : 1.5}
      >
        {image && <TilePhoto image={image} />}
        <Box flexGrow={1} justifyContent="flex-end" padding="m" gap="s">
          {!image && icon && (
            <Box flexGrow={1} alignItems="center" justifyContent="center">
              <TileIcon icon={icon} testID={testID && `${testID}-icon`} />
            </Box>
          )}
          <TileText
            title={title}
            description={description}
            onPhoto={image !== undefined}
          />
        </Box>
      </Box>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  photoTile: {
    width: "100%",
    aspectRatio: ASPECT_RATIO,
  },
  // Fills the row height, so icon tiles next to each other end level.
  iconTile: {
    width: "100%",
    flexGrow: 1,
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
