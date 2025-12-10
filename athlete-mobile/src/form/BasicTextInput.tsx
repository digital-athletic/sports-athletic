import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";

interface BasicTextInputProps extends TextInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
}

/**
 * Basic text input with standardized styling from StyleConstants.INPUT_FIELD_STYLES
 */
export const BasicTextInput: FC<BasicTextInputProps> = ({
  value,
  onChangeText,
  style,
  ...props
}) => {
  const { colors, spacing } = useTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={[
        styles.inputField,
        {
          color: colors.darkGrey3,
          paddingHorizontal: spacing.m,
        },
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  inputField: {
    flex: 1,
    fontSize: 16,
  },
});
