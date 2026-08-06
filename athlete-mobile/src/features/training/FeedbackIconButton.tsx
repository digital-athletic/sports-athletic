import { Ionicon } from "@/common/Ionicon";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";

const FEEDBACK_ICON = {
  TOO_EASY: {
    outline: "arrow-down-circle-outline",
    filled: "arrow-down-circle",
    color: "info",
  },
  SUCCEEDED: {
    outline: "checkmark-circle-outline",
    filled: "checkmark-circle",
    color: "darkGrey2",
  },
  TOO_HARD: {
    outline: "arrow-up-circle-outline",
    filled: "arrow-up-circle",
    color: "error",
  },
} as const;

export type FeedbackIconButtonProps = {
  feedback: DifficultyFeedbackType;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testId: string;
};

/**
 * A single tappable feedback icon (too-easy / succeeded / too-hard), filled
 * when disabled (already chosen) and outlined when still selectable. Shared
 * by the completed-checkmark, feedback-row, and plain-checkmark states in
 * TrainingListItemActions so that markup isn't duplicated per state.
 */
export const FeedbackIconButton: FC<FeedbackIconButtonProps> = ({
  feedback,
  onPress,
  disabled,
  accessibilityLabel,
  testId,
}) => {
  const { colors } = useTheme();
  const icon = FEEDBACK_ICON[feedback];

  return (
    <TouchableBox
      onPress={onPress}
      disabled={disabled}
      minWidth={36}
      minHeight={36}
      justifyContent="center"
      alignItems="center"
      accessibilityLabel={accessibilityLabel}
      testID={testId}
    >
      <Ionicon
        name={disabled ? icon.filled : icon.outline}
        size={32}
        color={colors[icon.color]}
      />
    </TouchableBox>
  );
};
