import { render, screen } from "@/utils/testUtils";
import { Dimensions, StyleSheet, Text } from "react-native";
import { ColumnScrollBox } from "./ColumnScrollBox";

const phonePortrait = { width: 411, height: 914, scale: 2, fontScale: 2 };
const tabletPortrait = { width: 800, height: 1280, scale: 2, fontScale: 2 };

const contentStyleOf = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.contentContainerStyle);

describe("ColumnScrollBox: content width", () => {
  it("caps and centers the content on a tablet and keeps the given content style", async () => {
    Dimensions.set({ window: tabletPortrait, screen: tabletPortrait });

    await render(
      <ColumnScrollBox testID="scroll" contentContainerStyle={{ padding: 20 }}>
        <Text>content</Text>
      </ColumnScrollBox>,
    );

    expect(contentStyleOf("scroll")).toMatchObject({
      padding: 20,
      maxWidth: 640,
      alignSelf: "center",
    });
  });

  it("leaves the content uncapped on a phone in portrait", async () => {
    Dimensions.set({ window: phonePortrait, screen: phonePortrait });

    await render(
      <ColumnScrollBox testID="scroll">
        <Text>content</Text>
      </ColumnScrollBox>,
    );

    expect(contentStyleOf("scroll").maxWidth).toBeUndefined();
  });
});
