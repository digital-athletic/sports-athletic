import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { useResponsiveProp } from "@shopify/restyle";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

type HintType = "WARNING" | "HINT";

type HintProps = {
  type: HintType;
  message: string;
};

/**
 * Info/warning hint box with icon and message.
 * Displays as a bordered box with colored text based on hint type.
 */
export const Hint: FC<HintProps> = ({ type, message }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const iconSize = useResponsiveProp({
    phone: 120,
    tablet: 180,
  });

  const isWarning = type === "WARNING";
  const iconName: IoniconName = isWarning ? "warning" : "information-circle";
  const textColor = isWarning ? "primary" : "darkGrey1";
  const accessibilityLabel = isWarning
    ? t("common.altText.warningIcon")
    : t("common.altText.hintIcon");

  return (
    <Box
      borderRadius="m"
      justifyContent="center"
      alignItems="stretch"
      alignSelf="stretch"
      flexDirection="row"
      backgroundColor="lightGrey1"
      paddingHorizontal="m"
      paddingVertical="xs"
    >
      {/* Icon area */}
      <Box justifyContent="center">
        <Box justifyContent="center" alignItems="center">
          <Ionicon
            name={iconName}
            size={iconSize}
            color={colors.lightGrey2}
            accessibilityLabel={accessibilityLabel}
          />
        </Box>
      </Box>

      {/* Message area */}
      <Box
        flex={1}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="m"
      >
        <Text variant="body" color={textColor} textAlign="center">
          {message}
        </Text>
      </Box>
    </Box>
  );
};

export default Hint;
