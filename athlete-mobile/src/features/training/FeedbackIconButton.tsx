import { Ionicon } from "@/common/Ionicon";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";

const FEEDBACK_ICON = {
  TOO_EASY: {
    outline: "arrow-up-circle-outline",
    filled: "arrow-up-circle",
    color: "info",
  },
  SUCCEEDED: {
    outline: "checkmark-circle-outline",
    filled: "checkmark-circle",
    color: "darkGrey2",
  },
  TOO_HARD: {
    outline: "arrow-down-circle-outline",
    filled: "arrow-down-circle",
    color: "error",
  },
} as const;

export type FeedbackIconButtonProps = {
  feedback: DifficultyFeedbackType;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Visible text above the icon. Names the button and wins over accessibilityLabel. */
  label?: string;
  size?: number;
  testId: string;
};

/**
 * A single tappable feedback icon (too easy, succeeded, too hard), filled when
 * disabled (already chosen) and outlined when still selectable. The arrow
 * points the way the next session moves: up for too easy, down for too hard.
 */
export const FeedbackIconButton: FC<FeedbackIconButtonProps> = ({
  feedback,
  onPress,
  disabled,
  accessibilityLabel,
  label,
  size = 32,
  testId,
}) => {
  const { colors } = useTheme();
  const icon = FEEDBACK_ICON[feedback];

  return (
    <TouchableBox
      onPress={onPress}
      disabled={disabled}
      minWidth={size + 4}
      minHeight={size + 4}
      justifyContent="center"
      alignItems="center"
      gap="xs"
      accessibilityRole="button"
      accessibilityLabel={label ?? accessibilityLabel}
      testID={testId}
    >
      {label && (
        <Text variant="small" color="darkGrey1">
          {label}
        </Text>
      )}
      <Ionicon
        name={disabled ? icon.filled : icon.outline}
        size={size}
        color={colors[icon.color]}
        decorative
      />
    </TouchableBox>
  );
};
