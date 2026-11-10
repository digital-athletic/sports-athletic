import { Box } from "@/theme/Box";
import { type FC, type PropsWithChildren } from "react";

// Two half tiles on a tablet would each grow to the size of a phone screen.
const GRID_MAX_WIDTH = 600;

type TileGridProps = PropsWithChildren<{ testID?: string }>;

/** Two column grid of half width tiles or cards. */
export const TileGrid: FC<TileGridProps> = ({ children, testID }) => (
  <Box
    flexDirection="row"
    flexWrap="wrap"
    justifyContent="space-between"
    rowGap="m"
    width="100%"
    maxWidth={GRID_MAX_WIDTH}
    testID={testID}
  >
    {children}
  </Box>
);
