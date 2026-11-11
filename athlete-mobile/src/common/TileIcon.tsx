import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { useTileWidth } from "@/common/TileGrid";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";

// Share of the cell width, so the icon scales from a phone to a tablet.
const WIDTH_SHARE = 0.35;
const SIZE_OUTSIDE_GRID = 48;

type TileIconProps = {
  icon: AppIconSource;
  testID?: string;
};

/** Large decorative icon of a tile, sized by the cell of its tile grid. */
export const TileIcon: FC<TileIconProps> = ({ icon, testID }) => {
  const { colors } = useTheme();
  const tileWidth = useTileWidth();
  const size =
    tileWidth === null
      ? SIZE_OUTSIDE_GRID
      : Math.round(tileWidth * WIDTH_SHARE);

  return (
    <Box
      width={size}
      height={size}
      testID={testID}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AppIcon icon={icon} size={size} color={colors.primary} decorative />
    </Box>
  );
};
