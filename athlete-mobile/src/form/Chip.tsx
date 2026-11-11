import { AppIcon } from "@/common/AppIcon";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { Pressable, StyleSheet } from "react-native";
import IconCheck from "@tabler/icons-react-native/IconCheck";

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** "radio" for a single choice, "button" for a toggle in a multi choice. */
  role?: "radio" | "button";
  /** Read by screen readers instead of the label, when the label is shortened. */
  accessibilityLabel?: string;
  /** "compact" fits several chips and a trailing action on one phone row. */
  size?: ChipSize;
};

export type ChipSize = "regular" | "compact";

const SIZES = {
  regular: { iconSize: 16, textVariant: "body" },
  compact: { iconSize: 14, textVariant: "small" },
} as const;

/** Pill shaped toggle. The state reaches screen readers through the role. */
export const Chip: FC<ChipProps> = ({
  label,
  selected,
  onPress,
  role = "button",
  accessibilityLabel,
  size = "regular",
}) => {
  const { colors } = useTheme();
  const { iconSize, textVariant } = SIZES[size];

  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      // react-native-web 0.21 maps only the aria props, not accessibilityState.
      aria-checked={role === "radio" ? selected : undefined}
      aria-selected={role === "button" ? selected : undefined}
      onPress={onPress}
      style={[
        styles.chip,
        styles[size],
        selected
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.white, borderColor: colors.lightGrey2 },
      ]}
    >
      {selected && (
        <AppIcon
          icon={IconCheck}
          size={iconSize}
          color={colors.white}
          decorative
        />
      )}
      <Text
        variant={textVariant}
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
  regular: {},
  compact: {
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
  },
});
