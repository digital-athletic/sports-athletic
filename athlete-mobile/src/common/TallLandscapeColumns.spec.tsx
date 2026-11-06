import { act, render, screen } from "@/utils/testUtils";
import { type FC, useEffect } from "react";
import { Dimensions, Text } from "react-native";
import { TallLandscapeColumns } from "./TallLandscapeColumns";

const tabletLandscape = { width: 1280, height: 800, scale: 2, fontScale: 2 };
const tabletPortrait = { width: 800, height: 1280, scale: 2, fontScale: 2 };
const phoneLandscape = { width: 800, height: 411, scale: 2, fontScale: 2 };

// Reports each time React creates this component. A second report for the same
// spot means React threw the old instance away, along with its state.
const MountSpy: FC<{ onMount: () => void }> = ({ onMount }) => {
  useEffect(() => {
    onMount();
  }, [onMount]);
  return null;
};

describe("TallLandscapeColumns: column layout", () => {
  it("puts the columns side by side in tall landscape", async () => {
    Dimensions.set({ window: tabletLandscape, screen: tabletLandscape });

    await render(
      <TallLandscapeColumns first={<Text>video</Text>}>
        <Text>content</Text>
      </TallLandscapeColumns>,
    );

    expect(screen.getByTestId("tall-landscape-columns")).toHaveStyle({
      flexDirection: "row",
    });
    expect(screen.getByTestId("tall-landscape-column-first")).toHaveStyle({
      width: "50%",
    });
    expect(screen.getByTestId("tall-landscape-column-second")).toHaveStyle({
      width: "50%",
    });
  });

  it.each([
    { name: "tablet in portrait", size: tabletPortrait },
    { name: "phone in landscape", size: phoneLandscape },
  ])("stacks the columns on a $name", async ({ size }) => {
    Dimensions.set({ window: size, screen: size });

    await render(
      <TallLandscapeColumns first={<Text>video</Text>}>
        <Text>content</Text>
      </TallLandscapeColumns>,
    );

    expect(screen.getByTestId("tall-landscape-columns")).toHaveStyle({
      flexDirection: "column",
    });
    expect(screen.getByTestId("tall-landscape-column-first")).toHaveStyle({
      width: "100%",
    });
    expect(screen.getByTestId("tall-landscape-column-second")).toHaveStyle({
      width: "100%",
    });
  });
});

describe("TallLandscapeColumns: rotation", () => {
  it("keeps the content of both columns mounted when the window rotates", async () => {
    const onMount = jest.fn();
    Dimensions.set({ window: tabletPortrait, screen: tabletPortrait });

    await render(
      <TallLandscapeColumns first={<MountSpy onMount={onMount} />}>
        <MountSpy onMount={onMount} />
      </TallLandscapeColumns>,
    );
    expect(onMount).toHaveBeenCalledTimes(2);

    await act(async () => {
      Dimensions.set({ window: tabletLandscape, screen: tabletLandscape });
    });

    // Proves the rotation reached the component, else the count below says nothing.
    expect(screen.getByTestId("tall-landscape-columns")).toHaveStyle({
      flexDirection: "row",
    });
    expect(onMount).toHaveBeenCalledTimes(2);
  });
});
