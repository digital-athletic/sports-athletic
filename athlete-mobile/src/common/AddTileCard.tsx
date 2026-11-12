import { AppIcon } from "@/common/AppIcon";
import { useTileCardHeaderHeight } from "@/common/TileCard";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { Pressable, StyleSheet } from "react-native";
import IconPlus from "@tabler/icons-react-native/IconPlus";

// Height of the name row of a tile card with a one-line name.
const TILE_CARD_FOOTER_HEIGHT = 52;

type AddTileCardProps = {
  label: string;
  onPress: () => void;
  testID?: string;
};

/** Dashed tile with a plus that ends a tile grid and adds an entry to it. */
export const AddTileCard: FC<AddTileCardProps> = ({
  label,
  onPress,
  testID,
}) => {
  const { colors, spacing, borderRadii } = useTheme();
  const headerHeight = useTileCardHeaderHeight();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          minHeight: headerHeight + TILE_CARD_FOOTER_HEIGHT,
          borderColor: colors.lightGrey3,
          borderRadius: borderRadii.xl,
          padding: spacing.m,
          gap: spacing.s,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <AppIcon icon={IconPlus} size={40} color={colors.primary} decorative />
      <Text variant="body" fontSize={15} fontWeight="700" textAlign="center">
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: "100%",
    // Fills the cell when a neighbouring tile wraps its name to two lines.
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  pressed: {
    opacity: 0.7,
  },
});
