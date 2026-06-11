import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme, type ThemeColor } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

type HintType = "WARNING" | "HINT";

type HintProps = {
  type: HintType;
  message: string;
};

const HINT_STYLES: Record<
  HintType,
  { icon: IoniconName; iconColor: ThemeColor; background: ThemeColor }
> = {
  WARNING: {
    icon: "warning-outline",
    iconColor: "warning",
    background: "warningTint",
  },
  HINT: {
    icon: "information-circle-outline",
    iconColor: "info",
    background: "infoTint",
  },
};

/**
 * Compact info/warning callout with a small leading icon and message.
 * A tinted background and colored icon communicate the hint type.
 */
export const Hint: FC<HintProps> = ({ type, message }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { icon, iconColor, background } = HINT_STYLES[type];
  const accessibilityLabel =
    type === "WARNING"
      ? t("common.altText.warningIcon")
      : t("common.altText.hintIcon");

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      gap="s"
      backgroundColor={background}
      borderRadius="m"
      paddingHorizontal="m"
      paddingVertical="s"
    >
      <Ionicon
        name={icon}
        size={22}
        color={colors[iconColor]}
        accessibilityLabel={accessibilityLabel}
      />
      <Box flex={1}>
        <Text variant="small" color="darkGrey2">
          {message}
        </Text>
      </Box>
    </Box>
  );
};

export default Hint;
