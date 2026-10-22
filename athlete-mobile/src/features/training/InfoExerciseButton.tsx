import { Ionicon } from "@/common/Ionicon";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

export type InfoExerciseButtonProps = {
  onPress: () => void;
  testId: string;
};

/** Opens exercise info for a checklist row; stays visible once completed. */
export const InfoExerciseButton: FC<InfoExerciseButtonProps> = ({
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
      accessibilityRole="button"
      accessibilityLabel={t("training.active.a11y.showExerciseInfo")}
      testID={testId}
    >
      <Ionicon
        name="information-circle-outline"
        size={20}
        color={colors.darkGrey2}
        decorative
      />
    </TouchableBox>
  );
};
