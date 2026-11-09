import { Box } from "@/theme/Box";
import { type FC } from "react";
import { type ChoiceOption } from "./ChoiceCards";
import { Chip } from "./Chip";

type ChoiceChipsProps = {
  options: readonly ChoiceOption[];
  value?: string | null;
  onChange: (value: string) => void;
  accessibilityLabel: string;
};

/** Single choice shown as a wrapping row of chips, for short option names. */
export const ChoiceChips: FC<ChoiceChipsProps> = ({
  options,
  value,
  onChange,
  accessibilityLabel,
}) => (
  <Box
    accessibilityRole="radiogroup"
    accessibilityLabel={accessibilityLabel}
    flexDirection="row"
    flexWrap="wrap"
    gap="s"
  >
    {options.map((option) => (
      <Chip
        key={option.value}
        role="radio"
        label={option.label}
        selected={option.value === value}
        onPress={() => onChange(option.value)}
      />
    ))}
  </Box>
);
