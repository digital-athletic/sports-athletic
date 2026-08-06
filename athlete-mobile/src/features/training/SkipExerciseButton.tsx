import { Ionicon } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

export type SkipExerciseButtonProps = {
  onPress: () => void;
  disabled: boolean;
  testId: string;
};

/** Skip control for a checklist row; hidden once the row is completed. */
export const SkipExerciseButton: FC<SkipExerciseButtonProps> = ({
  onPress,
  disabled,
  testId,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <TouchableBox
      onPress={onPress}
      disabled={disabled}
      minWidth={32}
      minHeight={32}
      justifyContent="center"
      alignItems="center"
      accessibilityLabel={t("training.list.skipExercise")}
      testID={testId}
    >
      <Box opacity={disabled ? 0 : 1}>
        <Ionicon name="play-forward" size={20} color={colors.darkGrey2} />
      </Box>
    </TouchableBox>
  );
};
