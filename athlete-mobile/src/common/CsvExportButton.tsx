import IconDownload from "@tabler/icons-react-native/IconDownload";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { AppIcon } from "@/common/AppIcon";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";

type CsvExportButtonProps = {
  onPress: () => void;
  disabled: boolean;
  accessibilityLabel: string;
  testID: string;
};

// Headers and chip rows leave little room, so the touch area reaches past the button.
const HIT_SLOP = { top: 10, bottom: 10, left: 8, right: 8 };

/** Download icon with the text "CSV", grey while disabled. */
export const CsvExportButton: FC<CsvExportButtonProps> = ({
  onPress,
  disabled,
  accessibilityLabel,
  testID,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const color = disabled ? "lightGrey3" : "primary";

  return (
    <TouchableBox
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
      flexDirection="row"
      alignItems="center"
      paddingVertical="xs"
      hitSlop={HIT_SLOP}
    >
      <AppIcon icon={IconDownload} size={16} color={colors[color]} />
      <Text variant="small" fontWeight="700" color={color} marginLeft="xs">
        {t("common.csv")}
      </Text>
    </TouchableBox>
  );
};
