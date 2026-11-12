import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { AppIcon, type AppIconSource } from "./AppIcon";

interface HeaderIconButtonProps {
  icon: AppIconSource;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
}

const HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

export const HeaderIconButton: FC<HeaderIconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
  testID,
}) => {
  const theme = useTheme();

  return (
    <TouchableBox
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      minWidth={36}
      minHeight={36}
      hitSlop={HIT_SLOP}
      alignItems="center"
      justifyContent="center"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <AppIcon icon={icon} size={28} color={theme.colors.onSurface} decorative />
    </TouchableBox>
  );
};
