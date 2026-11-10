import { Ionicon } from "@/common/Ionicon";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { Pressable, StyleSheet } from "react-native";

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** "radio" for a single choice, "button" for a toggle in a multi choice. */
  role?: "radio" | "button";
};

/** Pill shaped toggle. The state reaches screen readers through the role. */
export const Chip: FC<ChipProps> = ({
  label,
  selected,
  onPress,
  role = "button",
}) => {
  const { colors } = useTheme();
  const accessibilityState =
    role === "radio" ? { checked: selected } : { selected };

  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.white,
          borderColor: selected ? colors.primary : colors.lightGrey2,
        },
      ]}
    >
      {selected && (
        <Ionicon name="checkmark" size={16} color={colors.white} decorative />
      )}
      <Text
        variant="body"
        fontWeight={selected ? "600" : "500"}
        color={selected ? "white" : "darkGrey3"}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
  },
});
