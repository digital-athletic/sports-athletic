import { HeaderIconButton } from "@/common/HeaderIconButton";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExerciseInformationContent } from "./ExerciseInformationContent";

// The info view sets the sheet's height instead of fitting its content, which
// would grow past the screen and which Expo Go's older native side ignores.
const INFO_SHEET_FRACTION = 0.85;
export const INFO_SNAP_POINTS = [{ fraction: INFO_SHEET_FRACTION }];

type Props = {
  exercise: ExerciseType;
  title: string;
  isTimerActive: boolean;
  onBack: () => void;
};

/** The exercise information inside the checklist sheet, with a way back. */
export const TrainingExerciseInfoView: FC<Props> = ({
  exercise,
  title,
  isTimerActive,
  onBack,
}) => {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Box
      height={height * INFO_SHEET_FRACTION}
      paddingTop="m"
      testID="training-list-sheet-info-view"
    >
      <Box
        flexDirection="row"
        alignItems="center"
        paddingHorizontal="m"
        paddingBottom="s"
        gap="s"
      >
        <HeaderIconButton
          iconName="chevron-back"
          onPress={onBack}
          accessibilityLabel={t("training.list.a11y.hideExerciseInfo")}
          testID="training-list-sheet-info-back"
        />
        <Text variant="title" flex={1} numberOfLines={2}>
          {title}
        </Text>
      </Box>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <ExerciseInformationContent
          exercise={exercise}
          videoDisabled={!isTimerActive}
        />
      </ScrollView>
    </Box>
  );
};
