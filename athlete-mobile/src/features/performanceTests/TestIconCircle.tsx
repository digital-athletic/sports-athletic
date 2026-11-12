import { type FC } from "react";
import { useResponsiveProp } from "@shopify/restyle";
import { AppIcon } from "@/common/AppIcon";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { categoryIcon, categoryIconName } from "./testCategories";

type Props = {
  category?: string;
};

/** The category icon of a performance test, in a tinted circle that grows on tablets. */
export const TestIconCircle: FC<Props> = ({ category }) => {
  const { colors } = useTheme();
  const circleSize = useResponsiveProp({ phone: 36, tablet: 52 });
  const iconSize = useResponsiveProp({ phone: 20, tablet: 28 });

  return (
    <Box
      width={circleSize}
      height={circleSize}
      borderRadius="round"
      backgroundColor="primaryContainer"
      alignItems="center"
      justifyContent="center"
      testID={`performance-test-icon-${categoryIconName(category)}`}
    >
      <AppIcon
        icon={categoryIcon(category)}
        size={iconSize}
        color={colors.primary}
        decorative
      />
    </Box>
  );
};
