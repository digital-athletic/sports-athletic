import { Ionicon } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const FOOTER_HEIGHT = 80;

type Props = {
  isSkipHidden?: boolean;
  nextExerciseName: string | undefined;
  onSkipPress: () => void;
};

export const TrainingFooter: FC<Props> = ({
  isSkipHidden = false,
  nextExerciseName,
  onSkipPress,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const nextDisplayName = t("training.active.nextExercise", {
    exerciseName: nextExerciseName ?? t("training.active.finished"),
  });

  return (
    <Box
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      backgroundColor="lightGrey1"
      borderTopWidth={1}
      borderTopColor={"lightGrey2"}
    >
      <Box style={{ paddingBottom: insets.bottom }} padding="m">
        {!isSkipHidden ? (
          <TouchableBox
            justifyContent="center"
            alignItems="center"
            onPress={onSkipPress}
            accessibilityRole="button"
            accessibilityLabel={t("training.list.skipExercise")}
          >
            <Ionicon
              name="play-forward"
              size={24}
              color={colors.primary}
              decorative
            />
          </TouchableBox>
        ) : (
          <Box height={24} />
        )}
        <Text marginBottom="xs" fontWeight="bold" marginTop="m">
          {nextDisplayName}
        </Text>
      </Box>
    </Box>
  );
};
