import { Ionicon } from "@/common/Ionicon";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

export type SwapExerciseButtonProps = {
  exerciseName: string;
  onPress: () => void;
};

/** Replaces an exercise of the training overview with the next alternative. */
export const SwapExerciseButton: FC<SwapExerciseButtonProps> = ({
  exerciseName,
  onPress,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <TouchableBox
      onPress={onPress}
      minWidth={44}
      minHeight={44}
      justifyContent="center"
      alignItems="center"
      accessibilityRole="button"
      accessibilityLabel={t("training.overview.swapExercise", {
        name: exerciseName,
      })}
      testID="swap-exercise-button"
    >
      <Ionicon name="swap-horizontal" size={24} color={colors.darkGrey2} />
    </TouchableBox>
  );
};
