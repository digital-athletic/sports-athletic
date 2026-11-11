import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import {
  Children,
  createContext,
  type FC,
  isValidElement,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { type LayoutChangeEvent, useWindowDimensions } from "react-native";

// A tile never grows wider than on a large phone, so a tablet adds columns
// instead of stretching two tiles.
const MAX_TILE_WIDTH = 240;
const MIN_COLUMNS = 2;

const TileWidthContext = createContext<number | null>(null);

/**
 * Width of the cell a tile is placed in, so the tile scales its icon or
 * picture with it. Null outside a tile grid.
 */
export const useTileWidth = (): number | null => useContext(TileWidthContext);

type TileGridProps = PropsWithChildren<{
  /** Also names each cell, as `<testID>-cell`. */
  testID?: string;
}>;

/** Width of one cell, rounded down so pixel rounding never wraps a row. */
const cellWidthFor = (width: number, gap: number): number => {
  const columns = Math.max(
    MIN_COLUMNS,
    Math.ceil((width + gap) / (MAX_TILE_WIDTH + gap)),
  );
  return Math.floor((width - gap * (columns - 1)) / columns);
};

/**
 * Grid of tiles or cards at phone tile size: two columns on a phone, more on
 * a tablet. The tiles fill the width of their cell.
 */
export const TileGrid: FC<TileGridProps> = ({ children, testID }) => {
  const { spacing } = useTheme();
  const window = useWindowDimensions();
  // Until the first layout, guess the width of a screen with padding on both
  // sides, so a tablet does not flash two huge tiles.
  const [width, setWidth] = useState(window.width - 2 * spacing.l);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const cellWidth = cellWidthFor(width, spacing.m);

  return (
    <Box
      flexDirection="row"
      flexWrap="wrap"
      columnGap="m"
      rowGap="m"
      width="100%"
      onLayout={onLayout}
      testID={testID}
    >
      <TileWidthContext.Provider value={cellWidth}>
        {Children.toArray(children).map((child, index) => (
          <Box
            key={isValidElement(child) ? child.key : index}
            width={cellWidth}
            testID={testID && `${testID}-cell`}
          >
            {child}
          </Box>
        ))}
      </TileWidthContext.Provider>
    </Box>
  );
};
