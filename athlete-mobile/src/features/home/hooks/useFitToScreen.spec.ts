import { act, renderHook } from "@testing-library/react-native";
import { generateLayoutEvent } from "@test/factories/layoutEvent";
import { Platform } from "react-native";
import { useFitToScreen } from "./useFitToScreen";

// iPhone 17: status bar plus navigation bar.
const HEADER_HEIGHT = 116;
jest.mock("expo-router/react-navigation", () => ({
  useHeaderHeight: () => HEADER_HEIGHT,
}));

describe("useFitToScreen", () => {
  it("starts the content below the translucent header", async () => {
    const { result } = await renderHook(() => useFitToScreen());

    expect(result.current.contentContainerStyle).toEqual({
      flexGrow: 1,
      paddingTop: HEADER_HEIGHT,
    });
  });

  it("starts the scroll bar below the translucent header", async () => {
    const { result } = await renderHook(() => useFitToScreen());

    expect(result.current.scrollIndicatorInsets).toEqual({
      top: HEADER_HEIGHT,
    });
  });

  it.each(["android", "web"] as const)(
    "leaves no header room on %s, where the header is opaque",
    async (os) => {
      jest.replaceProperty(Platform, "OS", os);

      const { result } = await renderHook(() => useFitToScreen());

      expect(result.current.contentContainerStyle).toEqual({
        flexGrow: 1,
        paddingTop: 0,
      });
    },
  );

  it("keeps the regular layout while the content fits the screen", async () => {
    const { result } = await renderHook(() => useFitToScreen());

    await act(() => {
      result.current.onLayout(generateLayoutEvent(390, 670));
      result.current.onContentSizeChange(390, 670);
    });

    expect(result.current.compact).toBe(false);
  });

  it("switches to the compact layout once the content is taller than the screen", async () => {
    const { result } = await renderHook(() => useFitToScreen());

    await act(() => {
      result.current.onLayout(generateLayoutEvent(375, 554));
      result.current.onContentSizeChange(375, 662);
    });

    expect(result.current.compact).toBe(true);
  });

  it("stays compact when the compact content fits", async () => {
    const { result } = await renderHook(() => useFitToScreen());

    await act(() => {
      result.current.onLayout(generateLayoutEvent(375, 554));
      result.current.onContentSizeChange(375, 662);
    });
    await act(() => {
      result.current.onContentSizeChange(375, 554);
    });

    expect(result.current.compact).toBe(true);
  });

  it("measures again with the regular layout when the screen width changes", async () => {
    const { result } = await renderHook(() => useFitToScreen());

    await act(() => {
      result.current.onLayout(generateLayoutEvent(375, 554));
      result.current.onContentSizeChange(375, 662);
    });
    await act(() => {
      result.current.onLayout(generateLayoutEvent(667, 300));
    });

    expect(result.current.compact).toBe(false);
  });

  it("shows the regular layout after turning back when the content fits", async () => {
    const { result } = await renderHook(() => useFitToScreen());

    await act(() => {
      result.current.onLayout(generateLayoutEvent(375, 554));
      result.current.onContentSizeChange(375, 662);
    });
    await act(() => {
      result.current.onLayout(generateLayoutEvent(667, 300));
      result.current.onContentSizeChange(667, 300);
    });
    await act(() => {
      result.current.onContentSizeChange(375, 554);
      result.current.onLayout(generateLayoutEvent(375, 554));
    });

    expect(result.current.compact).toBe(false);
  });

  it("keeps the regular layout when the frame shrinks before the content after turning back", async () => {
    const { result } = await renderHook(() => useFitToScreen());

    // Sizes logged on an iPhone 17 simulator while turning it once around.
    await act(() => {
      result.current.onLayout(generateLayoutEvent(402, 791));
      result.current.onContentSizeChange(402, 791);
    });
    await act(() => {
      result.current.onLayout(generateLayoutEvent(874, 319));
      result.current.onContentSizeChange(874, 556);
    });
    await act(() => {
      result.current.onLayout(generateLayoutEvent(402, 822));
      result.current.onContentSizeChange(402, 822);
    });
    await act(() => {
      result.current.onLayout(generateLayoutEvent(402, 791));
      result.current.onContentSizeChange(402, 791);
    });

    expect(result.current.compact).toBe(false);
  });
});
