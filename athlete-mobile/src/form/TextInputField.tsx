import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
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
  title?: string;
  accessibilityLabel?: string;
  keyboardType?: KeyboardTypeOptions;
  onFocus?: () => void;
  onBlur?: () => void;
  testID?: string;
}

/**
 * Standard text input field with icon. The optional title shows a visible
 * label above the field. Without it, pass accessibilityLabel for screen readers.
 */
export const TextInputField: FC<TextInputFieldProps> = ({
  onChange,
  iconName,
  placeholder,
  value,
  title,
  accessibilityLabel,
  keyboardType = "default",
  onFocus,
  onBlur,
  testID,
}) => {
  const { colors } = useTheme();

  return (
    <Box>
      {title && (
        <Text variant="label" marginBottom="xs">
          {title}
        </Text>
      )}
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
          accessibilityLabel={accessibilityLabel ?? title}
          keyboardType={keyboardType}
          autoCapitalize="none"
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          testID={testID}
        />
      </Box>
    </Box>
  );
};
