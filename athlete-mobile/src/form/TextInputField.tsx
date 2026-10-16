import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { type KeyboardTypeOptions } from "react-native";
import { Ionicon, type IoniconName } from "../common/Ionicon";
import { BasicTextInput } from "./BasicTextInput";

interface TextInputFieldProps {
  onChange: (value: string) => void;
  iconName?: IoniconName;
  placeholder: string;
  value: string;
  keyboardType?: KeyboardTypeOptions;
  onFocus?: () => void;
  onBlur?: () => void;
  testID?: string;
}

/**
 * Standard text input field with icon
 */
export const TextInputField: FC<TextInputFieldProps> = ({
  onChange,
  iconName,
  placeholder,
  value,
  keyboardType = "default",
  onFocus,
  onBlur,
  testID,
}) => {
  const { colors } = useTheme();

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
        {iconName && (
          <Ionicon
            name={iconName}
            size={24}
            color={colors.lightGrey3}
            decorative
          />
        )}
      </Box>
      <BasicTextInput
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        testID={testID}
      />
    </Box>
  );
};
