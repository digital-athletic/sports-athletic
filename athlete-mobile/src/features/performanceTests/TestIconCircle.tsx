import { type FC } from "react";
import { useResponsiveProp } from "@shopify/restyle";
import IconStopwatch from "@tabler/icons-react-native/IconStopwatch";
import { AppIcon } from "@/common/AppIcon";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";

/** The stopwatch icon of a performance test in a tinted circle that grows on tablets. */
export const TestIconCircle: FC = () => {
  const { colors } = useTheme();
  const circleSize = useResponsiveProp({ phone: 36, tablet: 52 });
  const iconSize = useResponsiveProp({ phone: 20, tablet: 28 });

  return (
    <Box
      width={circleSize}
      height={circleSize}
      borderRadius="round"
      backgroundColor="primaryTint"
      alignItems="center"
      justifyContent="center"
    >
      <AppIcon
        icon={IconStopwatch}
        size={iconSize}
        color={colors.primary}
        decorative
      />
    </Box>
  );
};
