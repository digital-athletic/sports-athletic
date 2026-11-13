import { Box } from "@/theme/Box";
import { type FC } from "react";
import {
  clampProgress,
  TRAINING_PROGRESS_BAR_TEST_ID,
  type TrainingProgressBarProps,
} from "./utils/trainingProgressBarUtils";

/** Fallback for platforms without a native bar. iOS and Android use their own files. */
export const TrainingProgressBar: FC<TrainingProgressBarProps> = ({
  progress,
}) => {
  return (
    <Box
      testID={TRAINING_PROGRESS_BAR_TEST_ID}
      height={4}
      backgroundColor="lightGrey1"
    >
      <Box
        testID="training-progress-bar-fill"
        height="100%"
        backgroundColor="primary"
        width={`${clampProgress(progress) * 100}%`}
      />
    </Box>
  );
};
