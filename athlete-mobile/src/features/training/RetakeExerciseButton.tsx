import { AppIcon } from "@/common/AppIcon";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconRefresh from "@tabler/icons-react-native/IconRefresh";

export type RetakeExerciseButtonProps = {
  onPress: () => void;
  testId: string;
};

/** Reopens the skipped sets of a checklist row and starts the first one. */
export const RetakeExerciseButton: FC<RetakeExerciseButtonProps> = ({
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
      accessibilityLabel={t("training.list.retakeExercise")}
      testID={testId}
    >
      <AppIcon icon={IconRefresh} size={32} color={colors.info} decorative />
    </TouchableBox>
  );
};
