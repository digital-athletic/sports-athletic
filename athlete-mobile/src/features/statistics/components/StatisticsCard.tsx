import { Box } from "@/theme/Box";
import { type ComponentProps, type FC } from "react";

type StatisticsCardProps = ComponentProps<typeof Box>;

/** Bordered card of the statistics screen, styled like the anamnesis choice cards. */
export const StatisticsCard: FC<StatisticsCardProps> = ({
  children,
  ...props
}) => (
  <Box
    backgroundColor="white"
    borderWidth={1.5}
    borderColor="lightGrey2"
    borderRadius="xl"
    {...props}
  >
    {children}
  </Box>
);
