import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { Pressable, StyleSheet } from "react-native";

type WeekdayToggleProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

/** One day of the week row. All 7 share the row width. */
export const WeekdayToggle: FC<WeekdayToggleProps> = ({
  label,
  active,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.day,
        {
          backgroundColor: active ? colors.primary : colors.white,
          borderColor: active ? colors.primary : colors.lightGrey2,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Text
        variant="body"
        fontWeight={active ? "700" : "500"}
        color={active ? "white" : "darkGrey3"}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  day: {
    flex: 1,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
  },
});
