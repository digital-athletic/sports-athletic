import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { type KeyboardTypeOptions } from "react-native";
import { AwesomeIcon, type FontAwesomeIconName } from "../common/AwesomeIcon";
import { Ionicon, IoniconName } from "../common/Ionicon";
import { BasicTextInput } from "./BasicTextInput";

interface TextInputFieldProps {
  onChange: (value: string) => void;
  iconName?: IoniconName;
  awesomeIconName?: FontAwesomeIconName;
  placeholder: string;
  value: string;
  keyboardType?: KeyboardTypeOptions;
}

/**
 * Standard text input field with icon
 */
export const TextInputField: FC<TextInputFieldProps> = ({
  onChange,
  iconName,
  awesomeIconName,
  placeholder,
  value,
  keyboardType = "default",
}) => {
  const { colors } = useTheme();

  const renderIcon = () => {
    if (iconName) {
      return (
        <Ionicon
          name={iconName}
          size={24}
          color={colors.lightGrey3}
          accessibilityLabel="input-icon"
        />
      );
    } else if (awesomeIconName) {
      return (
        <AwesomeIcon
          name={awesomeIconName}
          size={24}
          color={colors.lightGrey3}
          accessibilityLabel="input-icon"
        />
      );
    }
    return null;
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      backgroundColor="lightGrey2"
      borderRadius="m"
      height={56}
    >
      <Box
        width={56}
        height={56}
        justifyContent="center"
        alignItems="center"
        backgroundColor="lightGrey1"
        borderTopLeftRadius="m"
        borderBottomLeftRadius="m"
      >
        {renderIcon()}
      </Box>
      <BasicTextInput
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
        value={value}
      />
    </Box>
  );
};
