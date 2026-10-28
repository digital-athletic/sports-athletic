import { Ionicon } from "@/common/Ionicon";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

export type SkipExerciseButtonProps = {
  onPress: () => void;
  testId: string;
};

/** Skip control for a pending checklist row. */
export const SkipExerciseButton: FC<SkipExerciseButtonProps> = ({
  onPress,
  testId,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <TouchableBox
      onPress={onPress}
      minWidth={32}
      minHeight={32}
      justifyContent="center"
      alignItems="center"
      accessibilityLabel={t("training.list.skipExercise")}
      testID={testId}
    >
      <Ionicon
        name="play-forward"
        size={20}
        color={colors.darkGrey2}
        decorative
      />
    </TouchableBox>
  );
};
