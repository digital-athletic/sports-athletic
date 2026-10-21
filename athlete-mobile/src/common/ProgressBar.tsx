import { useResponsiveProp } from "@shopify/restyle";
import { type FC } from "react";
import { Box } from "../theme/Box";

export type Props = {
  progress: number;
  maximum: number;
  toHide?: boolean;
};

/**
 * ProgressBar Component
 *
 * Displays a progress indicator using filled and empty bars.
 * Renders `progress` filled bars followed by `maximum - progress` empty bars.
 */
export const ProgressBar: FC<Props> = ({
  progress,
  maximum,
  toHide = false,
}) => {
  const barHeight = useResponsiveProp({
    phone: 8,
    tablet: 10,
    desktop: 12,
  });

  const filledBars = Array.from({ length: Math.max(0, progress) }, (_, i) => (
    <Box
      key={`filled_${i}`}
      flex={1}
      height={barHeight}
      backgroundColor="primary"
      borderRightWidth={1}
      borderRightColor="lightGrey2"
    />
  ));

  const emptyBars = Array.from(
    { length: Math.max(0, maximum - progress) },
    (_, i) => (
      <Box
        key={`empty_${i}`}
        flex={1}
        height={barHeight}
        backgroundColor="lightGrey1"
        borderRightWidth={1}
        borderRightColor="lightGrey2"
      />
    ),
  );

  return toHide ? (
    <Box />
  ) : (
    <Box
      flexDirection="row"
      height={barHeight}
      borderBottomWidth={1}
      borderBottomColor="lightGrey3"
      marginTop="xs"
    >
      {filledBars}
      {emptyBars}
    </Box>
  );
};
