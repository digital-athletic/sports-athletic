import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { Ionicon, type IoniconName } from "./Ionicon";

interface HeaderIconButtonProps {
  iconName: IoniconName;
  onPress: () => void;
  accessibilityLabel: string;
}

const HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

export const HeaderIconButton: FC<HeaderIconButtonProps> = ({
  iconName,
  onPress,
  accessibilityLabel,
}) => {
  const theme = useTheme();

  return (
    <TouchableBox
      onPress={onPress}
      minWidth={36}
      minHeight={36}
      hitSlop={HIT_SLOP}
      alignItems="center"
      justifyContent="center"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicon
        name={iconName}
        size={28}
        color={theme.colors.black}
        decorative
      />
    </TouchableBox>
  );
};
