import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme, type ThemeColor } from "@/theme/theme";
import { withOpacity } from "@/theme/withOpacity";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconAlertTriangle from "@tabler/icons-react-native/IconAlertTriangle";
import IconInfoCircle from "@tabler/icons-react-native/IconInfoCircle";

type HintType = "WARNING" | "HINT";

type HintProps = {
  type: HintType;
  message: string;
};

const HINT_STYLES: Record<
  HintType,
  {
    icon: AppIconSource;
    iconColor: ThemeColor;
    background: ThemeColor;
    backgroundOpacity: number;
    textColor: ThemeColor;
  }
> = {
  // Fixed roles keep the warm tint in both schemes
  WARNING: {
    icon: IconAlertTriangle,
    iconColor: "onTertiaryFixedVariant",
    background: "tertiaryFixed",
    backgroundOpacity: 1,
    textColor: "onTertiaryFixed",
  },
  // No info role is pale in both schemes, so info is laid over the surface like an M3 state layer
  HINT: {
    icon: IconInfoCircle,
    iconColor: "info",
    background: "info",
    backgroundOpacity: 0.08,
    textColor: "onSurfaceVariant",
  },
};

/**
 * Compact info/warning callout with a small leading icon and message.
 * The background and icon color communicate the hint type.
 */
export const Hint: FC<HintProps> = ({ type, message }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { icon, iconColor, background, backgroundOpacity, textColor } =
    HINT_STYLES[type];
  const accessibilityLabel =
    type === "WARNING"
      ? t("common.altText.warningIcon")
      : t("common.altText.hintIcon");

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      gap="s"
      style={{
        backgroundColor: withOpacity(colors[background], backgroundOpacity),
      }}
      borderRadius="m"
      paddingHorizontal="m"
      paddingVertical="s"
    >
      <AppIcon
        icon={icon}
        size={22}
        color={colors[iconColor]}
        accessibilityLabel={accessibilityLabel}
      />
      <Box flex={1}>
        <Text variant="small" color={textColor}>
          {message}
        </Text>
      </Box>
    </Box>
  );
};

export default Hint;
