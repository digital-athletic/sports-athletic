import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Slider } from "@expo/ui/community/slider";
import { type FC, useState } from "react";
import { Pressable } from "react-native";

type Option = { value: number; label: string };

type Props = {
  accessibilityLabel?: string;
  descriptionText?: string | null;
  onChange: (value: number) => void;
  sliderOptions: Option[];
  startItem: number;
  step?: number;
};

const LABEL_HIT_SLOP = 12;

export const SnapSliderInputField: FC<Props> = ({
  accessibilityLabel,
  descriptionText,
  onChange,
  sliderOptions,
  startItem,
  step = 1,
}) => {
  const { colors } = useTheme();

  const [selectedIndex, setSelectedIndex] = useState<number>(startItem ?? 0);

  const selectIndex = (index: number) => {
    if (index === selectedIndex) {
      return;
    }
    setSelectedIndex(index);
    onChange(sliderOptions[index].value);
  };

  // onValueChange fires on every drag frame, so only a new index counts.
  const handleValueChange = (value: number) => {
    selectIndex(Math.round(value));
  };

  return (
    <Box>
      {descriptionText ? <Text variant="body">{descriptionText}</Text> : null}
      <Box marginTop="s" paddingHorizontal="m">
        <Slider
          accessibilityLabel={accessibilityLabel}
          maximumTrackTintColor={colors.surfaceContainerHigh}
          maximumValue={Math.max(0, sliderOptions.length - 1)}
          minimumTrackTintColor={colors.primary}
          minimumValue={0}
          onValueChange={handleValueChange}
          step={step}
          thumbTintColor={colors.primary}
          value={selectedIndex}
        />
        <Box flexDirection="row" justifyContent="space-between" marginTop="s">
          {sliderOptions.map((opt, idx) => {
            const selected = idx === selectedIndex;
            return (
              <Pressable
                key={opt.label + idx}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                hitSlop={LABEL_HIT_SLOP}
                onPress={() => selectIndex(idx)}
              >
                <Text variant="small" color={selected ? "primary" : undefined}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
