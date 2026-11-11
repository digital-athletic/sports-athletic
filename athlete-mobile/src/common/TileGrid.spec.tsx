import { Text } from "@/theme/Text";
import { fireEvent, render, screen } from "@/utils/testUtils";
import { Dimensions } from "react-native";
import { TileGrid, useTileWidth } from "./TileGrid";

/** Layout event of a grid with the given width, e.g. 350 for a phone. */
const generateLayoutEvent = (width: number) => ({
  nativeEvent: { layout: { x: 0, y: 0, width, height: 600 } },
});

const GAP = 15;

describe("TileGrid: content", () => {
  it("renders every tile it receives", async () => {
    await render(
      <TileGrid testID="grid">
        <Text>Shoulder</Text>
        <Text>Spine</Text>
      </TileGrid>,
    );

    expect(screen.getByText("Shoulder")).toBeTruthy();
    expect(screen.getByText("Spine")).toBeTruthy();
  });

  it("leaves no empty cell for a tile that is not shown", async () => {
    const showKnee = false;
    await render(
      <TileGrid testID="grid">
        <Text>Shoulder</Text>
        {showKnee && <Text>Knee</Text>}
        {null}
      </TileGrid>,
    );

    expect(screen.getAllByTestId("grid-cell")).toHaveLength(1);
  });
});

describe("TileGrid: columns", () => {
  it("sizes the tiles from the window width before the first layout", async () => {
    await render(
      <TileGrid testID="grid">
        <Text>Shoulder</Text>
      </TileGrid>,
    );

    // The screen frame keeps 20 points of padding on both sides.
    const gridWidth = Dimensions.get("window").width - 40;
    const columns = Math.max(2, Math.ceil((gridWidth + GAP) / (240 + GAP)));
    expect(screen.getByTestId("grid-cell")).toHaveStyle({
      width: Math.floor((gridWidth - GAP * (columns - 1)) / columns),
    });
  });

  it("places two tiles per row on a phone", async () => {
    await render(
      <TileGrid testID="grid">
        <Text>Shoulder</Text>
      </TileGrid>,
    );
    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateLayoutEvent(350),
    );

    expect(screen.getByTestId("grid-cell")).toHaveStyle({
      width: Math.floor((350 - GAP) / 2),
    });
  });

  it("keeps two tiles per row on a narrow phone", async () => {
    await render(
      <TileGrid testID="grid">
        <Text>Shoulder</Text>
      </TileGrid>,
    );
    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateLayoutEvent(280),
    );

    expect(screen.getByTestId("grid-cell")).toHaveStyle({
      width: Math.floor((280 - GAP) / 2),
    });
  });

  it("switches to three columns once two tiles would exceed 240 points", async () => {
    await render(
      <TileGrid testID="grid">
        <Text>Shoulder</Text>
      </TileGrid>,
    );
    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateLayoutEvent(495),
    );
    expect(screen.getByTestId("grid-cell")).toHaveStyle({ width: 240 });

    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateLayoutEvent(496),
    );
    expect(screen.getByTestId("grid-cell")).toHaveStyle({
      width: Math.floor((496 - 2 * GAP) / 3),
    });
  });

  it("places four tiles per row on a tablet in portrait and six after a rotation", async () => {
    await render(
      <TileGrid testID="grid">
        <Text>Shoulder</Text>
      </TileGrid>,
    );
    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateLayoutEvent(984),
    );
    expect(screen.getByTestId("grid-cell")).toHaveStyle({
      width: Math.floor((984 - 3 * GAP) / 4),
    });

    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateLayoutEvent(1326),
    );
    expect(screen.getByTestId("grid-cell")).toHaveStyle({
      width: Math.floor((1326 - 5 * GAP) / 6),
    });
  });
});

describe("TileGrid: cell width for tiles", () => {
  /** Tile that prints the cell width it gets, e.g. "167". */
  const CellWidthProbe = () => <Text>{String(useTileWidth())}</Text>;

  it("tells its tiles the width of their cell", async () => {
    await render(
      <TileGrid testID="grid">
        <CellWidthProbe />
      </TileGrid>,
    );

    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateLayoutEvent(350),
    );

    expect(screen.getByText(String(Math.floor((350 - GAP) / 2)))).toBeTruthy();
  });

  it("gives no cell width to a tile outside a grid", async () => {
    await render(<CellWidthProbe />);

    expect(screen.getByText("null")).toBeTruthy();
  });
});
