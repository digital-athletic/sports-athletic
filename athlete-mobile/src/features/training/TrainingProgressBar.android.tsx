import { useTheme } from "@/theme/theme";
import { Host, LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
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
    <Host
      testID={TRAINING_PROGRESS_BAR_TEST_ID}
      matchContents={{ vertical: true }}
      style={{ width: "100%" }}
    >
      <LinearProgressIndicator
        progress={clampProgress(progress)}
        color={colors.primary}
        trackColor={colors.lightGrey2}
        modifiers={[fillMaxWidth()]}
      />
    </Host>
  );
};
