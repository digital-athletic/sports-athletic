import Ionicons from "@expo/vector-icons/Ionicons";
import { useResponsiveProp } from "@shopify/restyle";
import { type FC } from "react";
import { TouchableOpacity } from "react-native";
import { Box } from "../theme/Box";
import { useTheme } from "../theme/theme";

export type CheckBoxProps = {
  checked: boolean;
  changed: (next: boolean) => void;
};

export const CheckBox: FC<CheckBoxProps> = ({ checked, changed }) => {
  const theme = useTheme();
  const iconSize = useResponsiveProp({ phone: 36, tablet: 54 });

  const borderColor = checked ? theme.colors.primary : theme.colors.lightGrey3;
  const backgroundColor = checked
    ? theme.colors.primary
    : theme.colors.lightGrey2;

  const handlePress = () => {
    changed(!checked);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{ width: iconSize, height: iconSize }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      activeOpacity={0.8}
    >
      <Box
        width={iconSize}
        height={iconSize}
        style={{ borderRadius: 3 }}
        borderWidth={1}
        borderColor={borderColor}
        backgroundColor={backgroundColor}
        justifyContent="center"
        alignItems="center"
      >
        {checked && (
          <Ionicons
            name="checkmark"
            size={iconSize}
            color={theme.colors.white}
          />
        )}
      </Box>
    </TouchableOpacity>
  );
};
