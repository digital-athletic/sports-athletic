import { useTheme } from "@/theme/theme";
import {
  SegmentedControl as ExpoSegmentedControl,
  type NativeSegmentedControlChangeEvent,
} from "@expo/ui/community/segmented-control";
import { type ReactElement } from "react";
import { Platform } from "react-native";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  /** Web only, the native control has no per segment testID. */
  testID?: string;
};

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** Toggle between a few views. Native segmented control on iOS, Material 3 segmented buttons on Android. */
export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>): ReactElement => {
  const { colors } = useTheme();

  const handleChange = (event: NativeSegmentedControlChangeEvent) => {
    const option = options[event.nativeEvent.selectedSegmentIndex];
    if (option) onChange(option.value);
  };

  return (
    <ExpoSegmentedControl
      values={options.map((option) => option.label)}
      selectedIndex={options.findIndex((option) => option.value === value)}
      onChange={handleChange}
      appearance="light"
      accessibilityLabel={accessibilityLabel}
      // Replaces the Material default purple on Android.
      tintColor={Platform.OS === "android" ? colors.primaryTint : undefined}
    />
  );
};
