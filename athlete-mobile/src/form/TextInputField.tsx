import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC, useState } from "react";
import { type KeyboardTypeOptions, StyleSheet } from "react-native";
import { type IoniconName } from "../common/Ionicon";
import { BasicTextInput } from "./BasicTextInput";
import { FieldShell } from "./FieldShell";

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
  const [focused, setFocused] = useState(false);

  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
  };

  return (
    <Box>
      {title ? (
        <Text variant="label" marginBottom="xs">
          {title}
        </Text>
      ) : null}
      <FieldShell iconName={iconName} focused={focused}>
        <BasicTextInput
          onChangeText={onChange}
          placeholder={placeholder}
          accessibilityLabel={accessibilityLabel ?? title}
          keyboardType={keyboardType}
          autoCapitalize="none"
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
          style={styles.input}
        />
      </FieldShell>
    </Box>
  );
};

// The frame shows the focus, so the browser outline on web would double it.
// A solid outline of width 0 replaces the browser default, which ignores width.
const styles = StyleSheet.create({
  input: {
    alignSelf: "stretch",
    fontSize: 17,
    outlineStyle: "solid",
    outlineWidth: 0,
  },
});
