import { AppIcon } from "@/common/AppIcon";
import { useTileWidth } from "@/common/TileGrid";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC, type PropsWithChildren } from "react";
import { Pressable, StyleSheet } from "react-native";
import IconChevronRight from "@tabler/icons-react-native/IconChevronRight";

// Header height as a share of the cell width: 112 points on a phone.
const HEADER_HEIGHT_SHARE = 0.67;
const HEADER_HEIGHT_OUTSIDE_GRID = 112;
/** Height of the name row below the header, for a one-line name. */
export const TILE_CARD_FOOTER_HEIGHT = 52;

/** Height of the grey header of a tile card, scaled with its grid cell. */
export const useTileCardHeaderHeight = (): number => {
  const tileWidth = useTileWidth();
  return tileWidth === null
    ? HEADER_HEIGHT_OUTSIDE_GRID
    : Math.round(tileWidth * HEADER_HEIGHT_SHARE);
};

type TileCardProps = PropsWithChildren<{
  title: string;
  /** Read out in place of the title, e.g. "Team sprint, Draft". */
  accessibilityLabel?: string;
  onPress: () => void;
  testID?: string;
}>;

/**
 * Outlined card of a tile grid: an icon or picture on a grey header above the
 * name and an arrow. The header grows with the cell on a tablet.
 */
export const TileCard: FC<TileCardProps> = ({
  title,
  accessibilityLabel,
  onPress,
  testID,
  children,
}) => {
  const { colors } = useTheme();
  const headerHeight = useTileCardHeaderHeight();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
    >
      <Card variant="outlined" flex={1} overflow="hidden">
        <Box
          backgroundColor="lightGrey1"
          alignItems="center"
          justifyContent="center"
          height={headerHeight}
          testID={testID && `${testID}-header`}
        >
          {children}
        </Box>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="m"
          paddingVertical="m"
          gap="xs"
        >
          <Text variant="body" fontSize={15} fontWeight="700" flexShrink={1}>
            {title}
          </Text>
          <AppIcon
            icon={IconChevronRight}
            size={14}
            color={colors.lightGrey3}
            decorative
          />
        </Box>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  pressed: {
    opacity: 0.7,
  },
});
