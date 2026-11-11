import IconPlus from "@tabler/icons-react-native/IconPlus";
import { fireEvent, render, screen } from "@/utils/testUtils";
import { TileGrid } from "./TileGrid";
import { TrainingTile } from "./TrainingTile";

describe("TrainingTile: screen reader", () => {
  it("announces a button with title and description", async () => {
    await render(
      <TrainingTile
        title="Focus trainings"
        description="Ten minutes on one topic"
        icon={IconPlus}
        onPress={jest.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Focus trainings, Ten minutes on one topic",
      }),
    ).toBeTruthy();
  });

  it("announces only the title without a description", async () => {
    await render(
      <TrainingTile
        title="Imminent pains"
        icon={IconPlus}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Imminent pains" })).toBeTruthy();
  });
});

describe("TrainingTile: content", () => {
  it("shows title and description on a photo", async () => {
    await render(
      <TrainingTile
        title="Focus trainings"
        description="Ten minutes on one topic"
        image={{ uri: "https://example.com/focus.jpg" }}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Focus trainings")).toBeTruthy();
    expect(screen.getByText("Ten minutes on one topic")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await render(
      <TrainingTile
        title="Imminent pains"
        icon={IconPlus}
        onPress={onPress}
        testID="pain-tile"
      />,
    );

    fireEvent.press(screen.getByTestId("pain-tile"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

/** Layout event of a tile grid with the given width, e.g. 350 for a phone. */
const generateGridLayoutEvent = (width: number) => ({
  nativeEvent: { layout: { x: 0, y: 0, width, height: 600 } },
});

describe("TrainingTile: icon size", () => {
  it("scales the icon with the cell width of the tile grid", async () => {
    await render(
      <TileGrid testID="grid">
        <TrainingTile
          title="Focus trainings"
          icon={IconPlus}
          onPress={jest.fn()}
          testID="focus-tile"
        />
      </TileGrid>,
    );

    // A tablet in portrait: four cells of 234 points.
    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateGridLayoutEvent(984),
    );

    expect(
      screen.getByTestId("focus-tile-icon", { includeHiddenElements: true }),
    ).toHaveStyle({
      width: Math.round(234 * 0.35),
      height: Math.round(234 * 0.35),
    });
  });

  it("keeps an icon tile at least as tall as a photo tile in the same grid", async () => {
    await render(
      <TileGrid testID="grid">
        <TrainingTile
          title="Focus trainings"
          icon={IconPlus}
          onPress={jest.fn()}
          testID="focus-tile"
        />
      </TileGrid>,
    );

    await fireEvent(
      screen.getByTestId("grid"),
      "layout",
      generateGridLayoutEvent(984),
    );

    expect(screen.getByTestId("focus-tile")).toHaveStyle({
      minHeight: Math.round(234 / 1.1),
    });
  });
});
