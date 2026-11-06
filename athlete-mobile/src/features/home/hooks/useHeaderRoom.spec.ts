import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";
import { useHeaderRoom } from "./useHeaderRoom";

// iPhone 17: status bar plus navigation bar.
const HEADER_HEIGHT = 116;
jest.mock("expo-router/react-navigation", () => ({
  useHeaderHeight: () => HEADER_HEIGHT,
}));

describe("useHeaderRoom", () => {
  it("starts the content below the translucent header", async () => {
    const { result } = await renderHook(() => useHeaderRoom());

    expect(result.current.contentContainerStyle).toEqual({
      flexGrow: 1,
      paddingTop: HEADER_HEIGHT,
    });
  });

  it("starts the scroll bar below the translucent header", async () => {
    const { result } = await renderHook(() => useHeaderRoom());

    expect(result.current.scrollIndicatorInsets).toEqual({
      top: HEADER_HEIGHT,
    });
  });

  it.each(["android", "web"] as const)(
    "leaves no header room on %s, where the header is opaque",
    async (os) => {
      jest.replaceProperty(Platform, "OS", os);

      const { result } = await renderHook(() => useHeaderRoom());

      expect(result.current.contentContainerStyle).toEqual({
        flexGrow: 1,
        paddingTop: 0,
      });
    },
  );
});
