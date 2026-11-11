import { fireEvent, render, screen } from "@/utils/testUtils";
import { TileGrid } from "./TileGrid";
import { TileIcon } from "./TileIcon";

/** Layout event of a tile grid with the given width, e.g. 350 for a phone. */
const generateGridLayoutEvent = (width: number) => ({
  nativeEvent: { layout: { x: 0, y: 0, width, height: 600 } },
});

describe("TileIcon: size", () => {
  it("takes 35 percent of the cell width on a phone", async () => {
    await render(
      <TileGrid testID="grid">
        <TileIcon icon="add" testID="icon" />
      </TileGrid>,
    );

    // Two cells of 167 points.
    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateGridLayoutEvent(350),
    );

    expect(
      screen.getByTestId("icon", { includeHiddenElements: true }),
    ).toHaveStyle({
      width: Math.round(167 * 0.35),
      height: Math.round(167 * 0.35),
    });
  });

  it("grows on a tablet", async () => {
    await render(
      <TileGrid testID="grid">
        <TileIcon icon="add" testID="icon" />
      </TileGrid>,
    );

    // Four cells of 234 points.
    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateGridLayoutEvent(984),
    );

    expect(
      screen.getByTestId("icon", { includeHiddenElements: true }),
    ).toHaveStyle({
      width: Math.round(234 * 0.35),
    });
  });

  it("keeps a 48 point icon outside a tile grid", async () => {
    await render(<TileIcon icon="add" testID="icon" />);

    expect(
      screen.getByTestId("icon", { includeHiddenElements: true }),
    ).toHaveStyle({ width: 48, height: 48 });
  });

  it("stays hidden from screen readers", async () => {
    await render(<TileIcon icon="add" testID="icon" />);

    expect(
      screen.getByTestId("icon", { includeHiddenElements: true }),
    ).toHaveProp("importantForAccessibility", "no-hide-descendants");
  });
});
