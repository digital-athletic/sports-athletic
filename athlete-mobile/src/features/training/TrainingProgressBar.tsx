import { Box } from "@/theme/Box";
import { type FC } from "react";

type Props = {
  progress: number;
};

export const TrainingProgressBar: FC<Props> = ({ progress }) => {
  return (
    <Box height={4} backgroundColor="lightGrey1">
      <Box
        testID="training-progress-bar-fill"
        height="100%"
        backgroundColor="primary"
        width={`${progress * 100}%`}
      />
    </Box>
  );
};
