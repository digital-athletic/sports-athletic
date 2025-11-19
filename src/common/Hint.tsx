import { AwesomeIcon } from "@/common/AwesomeIcon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
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

  const isWarning = type === "WARNING";
  const iconName = isWarning ? "exclamation-circle" : "info-circle";
  const textColor = isWarning ? "primary" : "darkGrey1";
  const accessibilityLabel = isWarning
    ? t("common.altText.warningIcon")
    : t("common.altText.hintIcon");

  return (
    <Box
      height={112}
      borderRadius="m"
      justifyContent="center"
      alignItems="stretch"
      alignSelf="stretch"
      flexDirection="row"
      backgroundColor="lightGrey1"
      overflow="hidden"
    >
      {/* Icon area */}
      <Box flex={1} position="relative">
        <Box
          position="absolute"
          bottom={0}
          left={-16}
          width={40}
          height={40}
          justifyContent="center"
          alignItems="center"
        >
          <AwesomeIcon
            name={iconName}
            size={40}
            color={colors.lightGrey2}
            accessibilityLabel={accessibilityLabel}
          />
        </Box>
      </Box>

      {/* Message area */}
      <Box
        flex={2}
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
