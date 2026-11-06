import { useWindowDimensions } from "react-native";

// Android counts a screen as a tablet from 600 dp on its shorter side.
// In landscape the height is the shorter side.
const TALL_WINDOW_MIN_HEIGHT = 600;

type WindowClass = "portrait" | "shortLandscape" | "tallLandscape";

export const useWindowClass = (): WindowClass => {
  const { width, height } = useWindowDimensions();

  if (width <= height) {
    return "portrait";
  }
  return height < TALL_WINDOW_MIN_HEIGHT ? "shortLandscape" : "tallLandscape";
};
