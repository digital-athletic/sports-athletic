import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import Slider from "@react-native-community/slider";
import React, { type FC, useState } from "react";

type Option = { value: number; label: string };

type Props = {
  accessibilityLabel?: string;
  descriptionText?: string | null;
  onChange: (value: number) => void;
  sliderOptions: Option[];
  startItem: number;
  step?: number;
};

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

  const handleComplete = (value: number) => {
    // value is the actual numeric slider value; map it to the closest option index
    // Our slider will be configured so that value corresponds to index
    const index = Math.round(value);
    setSelectedIndex(index);
    onChange(sliderOptions[index].value);
  };

  // slider min/max based on options length; step=1 ensures snapping to indices
  const minimumValue = 0;
  const maximumValue = Math.max(0, sliderOptions.length - 1);

  return (
    <Box>
      {descriptionText ? <Text variant="body">{descriptionText}</Text> : null}
      <Box marginTop="s" paddingHorizontal="m">
        <Slider
          accessibilityLabel={accessibilityLabel}
          maximumValue={maximumValue}
          minimumTrackTintColor={colors.primary}
          minimumValue={minimumValue}
          onSlidingComplete={handleComplete}
          step={step}
          tapToSeek
          thumbTintColor={colors.primary}
          value={selectedIndex}
        />
        <Box flexDirection="row" justifyContent="space-between" marginTop="s">
          {sliderOptions.map((opt, idx) => (
            <Text key={opt.label + idx} variant="small">
              {opt.label}
            </Text>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
