import { Box } from "@/theme/Box";
import { useWindowClass } from "@/theme/useWindowClass";
import { type FC, type PropsWithChildren, type ReactNode } from "react";

type Props = PropsWithChildren<{
  first: ReactNode;
}>;

/**
 * Shows two columns in tall landscape and stacks them otherwise.
 * Both layouts keep the same element tree, so a running timer and video survive
 * when the device rotates. The columns set a width and no flex: with flex they
 * kept a wrong size after rotating back.
 */
export const TallLandscapeColumns: FC<Props> = ({ first, children }) => {
  const isTallLandscape = useWindowClass() === "tallLandscape";
  const columnWidth = isTallLandscape ? "50%" : "100%";

  return (
    <Box
      testID="tall-landscape-columns"
      flexDirection={isTallLandscape ? "row" : "column"}
    >
      <Box testID="tall-landscape-column-first" width={columnWidth}>
        {first}
      </Box>
      <Box testID="tall-landscape-column-second" width={columnWidth}>
        {children}
      </Box>
    </Box>
  );
};
