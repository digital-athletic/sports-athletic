import { Box } from "@/theme/Box";
import { useWindowClass } from "@/theme/useWindowClass";
import { type FC, type PropsWithChildren, type ReactNode } from "react";

type Props = PropsWithChildren<{
  first: ReactNode;
  /**
   * Set this outside a ScrollView. The second column then fills the remaining
   * height and can hold a ScrollView of its own.
   */
  fillHeight?: boolean;
}>;

/**
 * Shows two columns in tall landscape and stacks them otherwise. The element
 * tree stays the same, so a running timer and video keep running on rotation.
 * The column size comes from width. If flex changes on rotation, the columns
 * keep a wrong size after rotating back.
 */
export const TallLandscapeColumns: FC<Props> = ({
  first,
  fillHeight,
  children,
}) => {
  const isTallLandscape = useWindowClass() === "tallLandscape";
  const columnWidth = isTallLandscape ? "50%" : "100%";
  const flex = fillHeight ? 1 : undefined;

  return (
    <Box
      testID="tall-landscape-columns"
      flex={flex}
      flexDirection={isTallLandscape ? "row" : "column"}
    >
      <Box testID="tall-landscape-column-first" width={columnWidth}>
        {first}
      </Box>
      <Box
        testID="tall-landscape-column-second"
        flex={flex}
        width={columnWidth}
      >
        {children}
      </Box>
    </Box>
  );
};
