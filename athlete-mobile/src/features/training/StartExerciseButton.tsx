import { AppIcon } from "@/common/AppIcon";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { secondsToMMSS } from "@/utils/date";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconPlayerPlayFilled from "@tabler/icons-react-native/IconPlayerPlayFilled";

export type StartExerciseButtonProps = {
  onPress: () => void;
  /** Saved timer value; set when the next set continues where it was left. */
  resumeSeconds?: number;
  testId: string;
};

/**
 * Opens the exercise-timer bottom sheet for a pending checklist row. A set
 * that resumes shows its saved timer value and a blue start icon.
 */
export const StartExerciseButton: FC<StartExerciseButtonProps> = ({
  onPress,
  resumeSeconds,
  testId,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isResume = resumeSeconds !== undefined;

  return (
    <TouchableBox
      onPress={onPress}
      minWidth={36}
      minHeight={36}
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      gap="s"
      accessibilityRole="button"
      accessibilityLabel={
        isResume
          ? t("training.list.continueExercise", {
              time: secondsToMMSS(resumeSeconds),
            })
          : t("training.list.startExercise")
      }
      testID={testId}
    >
      {isResume && (
        <Text variant="small" color="info" testID={`${testId}-resume-time`}>
          {secondsToMMSS(resumeSeconds)}
        </Text>
      )}
      <AppIcon
        icon={IconPlayerPlayFilled}
        size={32}
        color={isResume ? colors.info : colors.primary}
        decorative
      />
    </TouchableBox>
  );
};
