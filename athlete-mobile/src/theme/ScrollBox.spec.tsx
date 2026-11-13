import { render, screen } from "@/utils/testUtils";
import { StyleSheet } from "react-native";
import { ScrollBox } from "./ScrollBox";
import { colors } from "./colors";

describe("ScrollBox: styles", () => {
  it("keeps the theme background when a style is passed as well", async () => {
    await render(
      <ScrollBox
        testID="scroll"
        backgroundColor="surface"
        style={{ marginTop: 12 }}
      />,
    );

    const style = StyleSheet.flatten(screen.getByTestId("scroll").props.style);
    expect(style).toMatchObject({
      backgroundColor: colors.surface,
      marginTop: 12,
    });
  });
});
