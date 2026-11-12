import { useTheme } from "@/theme/theme";
import { Host, LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, testID } from "@expo/ui/jetpack-compose/modifiers";
import { type FC } from "react";
import {
  clampProgress,
  TRAINING_PROGRESS_BAR_TEST_ID,
  type TrainingProgressBarProps,
} from "./utils/trainingProgressBarUtils";

export const TrainingProgressBar: FC<TrainingProgressBarProps> = ({
  progress,
}) => {
  const { colors } = useTheme();

  return (
    <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
      <LinearProgressIndicator
        progress={clampProgress(progress)}
        color={colors.primary}
        trackColor={colors.lightGrey2}
        modifiers={[fillMaxWidth(), testID(TRAINING_PROGRESS_BAR_TEST_ID)]}
      />
    </Host>
  );
};
