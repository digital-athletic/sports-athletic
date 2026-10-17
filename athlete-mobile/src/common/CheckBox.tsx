import { useResponsiveProp } from "@shopify/restyle";
import { type FC } from "react";
import { TouchableOpacity } from "react-native";
import { Box } from "../theme/Box";
import { useTheme } from "../theme/theme";
import { Ionicon } from "./Ionicon";

export type CheckBoxProps = {
  checked: boolean;
  changed: (next: boolean) => void;
  accessibilityLabel?: string;
};

export const CheckBox: FC<CheckBoxProps> = ({
  checked,
  changed,
  accessibilityLabel,
}) => {
  const theme = useTheme();
  const iconSize = useResponsiveProp({ phone: 36, tablet: 54 });

  const handlePress = () => {
    changed(!checked);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{ width: iconSize, height: iconSize }}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      activeOpacity={0.8}
    >
      <Box
        width={iconSize}
        height={iconSize}
        borderRadius="s"
        borderWidth={1}
        borderColor={checked ? "primary" : "lightGrey3"}
        backgroundColor={checked ? "primary" : "lightGrey2"}
        justifyContent="center"
        alignItems="center"
      >
        {checked && (
          <Ionicon
            name="checkmark"
            size={iconSize}
            color={theme.colors.white}
            decorative
          />
        )}
      </Box>
    </TouchableOpacity>
  );
};
