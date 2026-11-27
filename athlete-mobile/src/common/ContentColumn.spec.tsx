import { act, render, screen } from "@/utils/testUtils";
import { Dimensions, Text } from "react-native";
import { CONTENT_MAX_WIDTH, ContentColumn } from "./ContentColumn";

const phonePortrait = { width: 411, height: 914, scale: 2, fontScale: 2 };
const phoneLandscape = { width: 914, height: 411, scale: 2, fontScale: 2 };
const tabletPortrait = { width: 800, height: 1280, scale: 2, fontScale: 2 };
const tabletLandscape = { width: 1280, height: 800, scale: 2, fontScale: 2 };

describe("ContentColumn: width", () => {
  it("fills the width of a phone in portrait", async () => {
    Dimensions.set({ window: phonePortrait, screen: phonePortrait });

    await render(
      <ContentColumn testID="column">
        <Text>content</Text>
      </ContentColumn>,
    );

    const column = screen.getByTestId("column");
    expect(column).toHaveStyle({ width: "100%" });
    expect(column).not.toHaveStyle({ maxWidth: CONTENT_MAX_WIDTH });
  });

  it.each([
    { name: "tablet in portrait", size: tabletPortrait },
    { name: "tablet in landscape", size: tabletLandscape },
    { name: "phone in landscape", size: phoneLandscape },
  ])("caps and centers the content on a $name", async ({ size }) => {
    Dimensions.set({ window: size, screen: size });

    await render(
      <ContentColumn testID="column">
        <Text>content</Text>
      </ContentColumn>,
    );

    expect(screen.getByTestId("column")).toHaveStyle({
      width: "100%",
      maxWidth: 640,
      alignSelf: "center",
    });
  });

  it("caps the content after a phone rotates to landscape", async () => {
    Dimensions.set({ window: phonePortrait, screen: phonePortrait });
    await render(
      <ContentColumn testID="column">
        <Text>content</Text>
      </ContentColumn>,
    );

    await act(async () => {
      Dimensions.set({ window: phoneLandscape, screen: phoneLandscape });
    });

    expect(screen.getByTestId("column")).toHaveStyle({ maxWidth: 640 });
  });

  it("keeps the spacing props of a Box", async () => {
    Dimensions.set({ window: tabletPortrait, screen: tabletPortrait });

    await render(
      <ContentColumn testID="column" padding="l">
        <Text>content</Text>
      </ContentColumn>,
    );

    expect(screen.getByTestId("column")).toHaveStyle({ padding: 20 });
  });
});
