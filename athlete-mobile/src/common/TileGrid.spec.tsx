import { Text } from "@/theme/Text";
import { render, screen } from "@/utils/testUtils";
import { TileGrid } from "./TileGrid";

describe("TileGrid: layout", () => {
  it("renders every tile it receives", async () => {
    await render(
      <TileGrid>
        <Text>Shoulder</Text>
        <Text>Spine</Text>
      </TileGrid>,
    );

    expect(screen.getByText("Shoulder")).toBeTruthy();
    expect(screen.getByText("Spine")).toBeTruthy();
  });

  it("caps its width so half tiles stay at phone size on a tablet", async () => {
    await render(
      <TileGrid testID="grid">
        <Text>Shoulder</Text>
      </TileGrid>,
    );

    expect(screen.getByTestId("grid")).toHaveStyle({ maxWidth: 600 });
  });
});
