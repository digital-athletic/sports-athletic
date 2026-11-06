import { renderHook } from "@testing-library/react-native";
import { Dimensions } from "react-native";
import { useWindowClass } from "./useWindowClass";

describe("useWindowClass", () => {
  it.each([
    {
      name: "phone in landscape",
      width: 800,
      height: 411,
      expected: "shortLandscape",
    },
    {
      name: "split tablet window",
      width: 1280,
      height: 400,
      expected: "shortLandscape",
    },
    {
      name: "tablet in landscape",
      width: 1280,
      height: 800,
      expected: "tallLandscape",
    },
    {
      name: "window exactly at the limit",
      width: 960,
      height: 600,
      expected: "tallLandscape",
    },
    {
      name: "tablet in portrait",
      width: 800,
      height: 1280,
      expected: "portrait",
    },
    {
      name: "short portrait window",
      width: 360,
      height: 400,
      expected: "portrait",
    },
    {
      name: "square window",
      width: 800,
      height: 800,
      expected: "portrait",
    },
  ])("classifies a $name as $expected", async ({ width, height, expected }) => {
    const size = { width, height, scale: 2, fontScale: 2 };
    Dimensions.set({ window: size, screen: size });

    const { result } = await renderHook(() => useWindowClass());

    expect(result.current).toBe(expected);
  });
});
