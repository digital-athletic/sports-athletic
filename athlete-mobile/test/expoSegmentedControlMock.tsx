import type {
  NativeSegmentedControlChangeEvent,
  SegmentedControlProps,
} from "@expo/ui/community/segmented-control";
import { type ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

export type { NativeSegmentedControlChangeEvent, SegmentedControlProps };

/** Stand in for the native control: one tab per value, so tests can query by role. */
export const SegmentedControl = ({
  values = [],
  selectedIndex,
  onChange,
  onValueChange,
  accessibilityLabel,
}: SegmentedControlProps): ReactElement => (
  <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
    {values.map((label, index) => (
      <Pressable
        key={label}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: index === selectedIndex }}
        onPress={() => {
          onValueChange?.(label);
          onChange?.({
            nativeEvent: { selectedSegmentIndex: index, value: label },
          });
        }}
      >
        <Text>{label}</Text>
      </Pressable>
    ))}
  </View>
);

export default SegmentedControl;
