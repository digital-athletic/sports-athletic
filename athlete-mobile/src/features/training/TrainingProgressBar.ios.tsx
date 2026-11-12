import { useTheme } from "@/theme/theme";
import { Host, ProgressView } from "@expo/ui/swift-ui";
import { progressViewStyle, tint } from "@expo/ui/swift-ui/modifiers";
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
      <ProgressView
        value={clampProgress(progress)}
        modifiers={[progressViewStyle("linear"), tint(colors.primary)]}
      />
    </Host>
  );
};
