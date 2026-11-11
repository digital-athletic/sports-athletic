import { Text } from "@/theme/Text";
import { fireEvent, render, screen } from "@/utils/testUtils";
import { TileCard } from "./TileCard";
import { TileGrid } from "./TileGrid";

/** Layout event of a tile grid with the given width, e.g. 350 for a phone. */
const generateGridLayoutEvent = (width: number) => ({
  nativeEvent: { layout: { x: 0, y: 0, width, height: 600 } },
});

describe("TileCard: content", () => {
  it("announces a button with the name", async () => {
    await render(
      <TileCard title="Your trainings" onPress={jest.fn()} testID="card">
        <Text>Media</Text>
      </TileCard>,
    );

    expect(screen.getByRole("button", { name: "Your trainings" })).toBeTruthy();
    expect(screen.getByText("Media")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await render(
      <TileCard title="Knee & Hip" onPress={onPress} testID="card">
        <Text>Media</Text>
      </TileCard>,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Knee & Hip" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("TileCard: header size", () => {
  it("keeps a 112 point header on a phone", async () => {
    await render(
      <TileGrid testID="grid">
        <TileCard title="Your trainings" onPress={jest.fn()} testID="card">
          <Text>Media</Text>
        </TileCard>
      </TileGrid>,
    );

    // Two cells of 167 points.
    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateGridLayoutEvent(350),
    );

    expect(screen.getByTestId("card-header")).toHaveStyle({
      height: Math.round(167 * 0.67),
    });
  });

  it("grows the header with the cell on a tablet", async () => {
    await render(
      <TileGrid testID="grid">
        <TileCard title="Your trainings" onPress={jest.fn()} testID="card">
          <Text>Media</Text>
        </TileCard>
      </TileGrid>,
    );

    // Four cells of 234 points.
    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateGridLayoutEvent(984),
    );

    expect(screen.getByTestId("card-header")).toHaveStyle({
      height: Math.round(234 * 0.67),
    });
  });
});
