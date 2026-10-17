import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { StyleSheet, Switch } from "react-native";

interface SwitchInputFieldProps {
  value: boolean;
  descriptionText: string;
  accessibilityLabel?: string;
  onChange: (value: boolean) => void;
  showError?: boolean;
  size?: "small" | "normal";
  color?: string;
  thumbColor?: string;
}

/**
 * Switch input field with description text
 */
export const SwitchInputField: FC<SwitchInputFieldProps> = ({
  value,
  descriptionText,
  accessibilityLabel,
  onChange,
  size = "normal",
  color,
  thumbColor,
}) => {
  const { colors } = useTheme();

  const scaleStyle = size === "small" ? styles.smallSwitch : undefined;
  const trackColor = color || colors.primary;
  const thumbTintColor = thumbColor || colors.lightGrey3;

  return (
    <Box padding="l">
      <Box flexDirection="row" alignItems="center" justifyContent="flex-start">
        <Switch
          trackColor={{
            false: colors.darkGrey1,
            true: trackColor,
          }}
          thumbColor={thumbTintColor}
          value={value}
          onValueChange={onChange}
          style={scaleStyle}
          accessibilityLabel={accessibilityLabel ?? descriptionText}
        />
        <Box flex={1} marginLeft="m">
          <Text variant="body" color="darkGrey3">
            {descriptionText}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  smallSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});
