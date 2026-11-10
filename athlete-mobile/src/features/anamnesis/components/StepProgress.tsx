import { Box } from "@/theme/Box";
import { type FC } from "react";

type StepProgressProps = {
  current: number;
  total: number;
};

/**
 * Row of pills, one per step of the flow. It is decorative: the screen states
 * the step in text, so screen readers skip the pills.
 */
export const StepProgress: FC<StepProgressProps> = ({ current, total }) => (
  <Box
    flexDirection="row"
    gap="xs"
    width={160}
    aria-hidden
    importantForAccessibility="no-hide-descendants"
  >
    {Array.from({ length: total }, (_, index) => (
      <Box
        key={index}
        flex={1}
        height={5}
        borderRadius="round"
        backgroundColor={index < current ? "primary" : "lightGrey2"}
      />
    ))}
  </Box>
);
