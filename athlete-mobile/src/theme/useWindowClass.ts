import { useWindowDimensions } from "react-native";

// Android counts a screen as a tablet from 600 dp on its shorter side.
// In landscape the height is the shorter side.
const TABLET_MIN_SHORTER_SIDE = 600;

type WindowClass = "portrait" | "shortLandscape" | "wideLandscape";

export const useWindowClass = (): WindowClass => {
  const { width, height } = useWindowDimensions();

  if (width <= height) {
    return "portrait";
  }
  return height < TABLET_MIN_SHORTER_SIDE ? "shortLandscape" : "wideLandscape";
};
