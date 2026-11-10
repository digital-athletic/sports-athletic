import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { Pressable, StyleSheet } from "react-native";

export type ChoiceOption = {
  value: string;
  label: string;
  /** Screen reader name when the visible label is a short form of it. */
  accessibilityLabel?: string;
  description?: string;
  iconName?: IoniconName;
};

type ChoiceCardsProps = {
  options: readonly ChoiceOption[];
  value?: string | null;
  onChange: (value: string) => void;
  accessibilityLabel: string;
  /** "row" puts the cards next to each other, for 2 short options. */
  direction?: "row" | "column";
};

type ChoiceCardProps = {
  option: ChoiceOption;
  selected: boolean;
  stretch: boolean;
  onPress: () => void;
};

const RadioMark: FC<{ selected: boolean }> = ({ selected }) => {
  const { colors } = useTheme();

  return (
    <Box
      width={24}
      height={24}
      borderRadius="round"
      borderWidth={selected ? 0 : 2}
      borderColor="lightGrey3"
      backgroundColor={selected ? "primary" : "white"}
      alignItems="center"
      justifyContent="center"
    >
      {selected && (
        <Ionicon name="checkmark" size={16} color={colors.white} decorative />
      )}
    </Box>
  );
};

const ChoiceCard: FC<ChoiceCardProps> = ({
  option,
  selected,
  stretch,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={option.accessibilityLabel ?? option.label}
      accessibilityHint={option.description}
      // react-native-web 0.21 maps only the aria props, not accessibilityState.
      aria-checked={selected}
      onPress={onPress}
      style={[
        styles.card,
        stretch && styles.stretch,
        {
          backgroundColor: selected ? colors.primaryTint : colors.white,
          borderColor: selected ? colors.primary : colors.lightGrey2,
        },
      ]}
    >
      {option.iconName && (
        <Ionicon
          name={option.iconName}
          size={24}
          color={selected ? colors.primary : colors.darkGrey1}
          decorative
        />
      )}
      <Box flex={1}>
        <Text variant="body" fontWeight="600">
          {option.label}
        </Text>
        {option.description && (
          <Text variant="small" color="darkGrey1" marginTop="xs">
            {option.description}
          </Text>
        )}
      </Box>
      <RadioMark selected={selected} />
    </Pressable>
  );
};

/** Single choice shown as tappable cards, so every option is visible at once. */
export const ChoiceCards: FC<ChoiceCardsProps> = ({
  options,
  value,
  onChange,
  accessibilityLabel,
  direction = "column",
}) => (
  <Box
    accessibilityRole="radiogroup"
    accessibilityLabel={accessibilityLabel}
    flexDirection={direction}
    gap="s"
  >
    {options.map((option) => (
      <ChoiceCard
        key={option.value}
        option={option}
        selected={option.value === value}
        stretch={direction === "row"}
        onPress={() => onChange(option.value)}
      />
    ))}
  </Box>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  stretch: {
    flex: 1,
  },
});
