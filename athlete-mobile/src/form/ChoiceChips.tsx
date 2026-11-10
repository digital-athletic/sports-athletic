import { Box } from "@/theme/Box";
import { type FC } from "react";
import { type ChoiceOption } from "./ChoiceCards";
import { Chip, type ChipSize } from "./Chip";

type ChoiceChipsProps = {
  options: readonly ChoiceOption[];
  value?: string | null;
  onChange: (value: string) => void;
  accessibilityLabel: string;
  size?: ChipSize;
};

/** Single choice shown as a wrapping row of chips, for short option names. */
export const ChoiceChips: FC<ChoiceChipsProps> = ({
  options,
  value,
  onChange,
  accessibilityLabel,
  size,
}) => (
  <Box
    accessibilityRole="radiogroup"
    accessibilityLabel={accessibilityLabel}
    flexDirection="row"
    flexWrap="wrap"
    gap={size === "compact" ? "xs" : "s"}
  >
    {options.map((option) => (
      <Chip
        key={option.value}
        role="radio"
        label={option.label}
        accessibilityLabel={option.accessibilityLabel}
        size={size}
        selected={option.value === value}
        onPress={() => onChange(option.value)}
      />
    ))}
  </Box>
);
