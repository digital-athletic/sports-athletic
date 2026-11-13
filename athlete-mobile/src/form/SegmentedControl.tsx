import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type ReactElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  testID?: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** Pill toggle between a few views. Each segment is a tab of a tab list. */
export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>): ReactElement => {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: colors.surfaceContainer }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            // react-native-web 0.21 maps only the aria props, not accessibilityState.
            aria-selected={selected}
            testID={option.testID}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected && [
                styles.selected,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  shadowColor: colors.shadow,
                },
              ],
            ]}
          >
            <Text
              variant="body"
              fontWeight={selected ? "700" : "500"}
              color={selected ? "primary" : "onSurfaceVariant"}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 22,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  selected: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
});
