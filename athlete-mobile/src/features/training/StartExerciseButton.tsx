import { Ionicon } from "@/common/Ionicon";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

export type StartExerciseButtonProps = {
  onPress: () => void;
  testId: string;
};

/** Opens the exercise-timer bottom sheet for a pending checklist row. */
export const StartExerciseButton: FC<StartExerciseButtonProps> = ({
  onPress,
  testId,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <TouchableBox
      onPress={onPress}
      minWidth={36}
      minHeight={36}
      justifyContent="center"
      alignItems="center"
      accessibilityRole="button"
      accessibilityLabel={t("training.list.startExercise")}
      testID={testId}
    >
      <Ionicon name="play-circle" size={28} color={colors.primary} decorative />
    </TouchableBox>
  );
};
