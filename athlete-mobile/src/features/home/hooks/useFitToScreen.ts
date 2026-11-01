import { useHeaderHeight } from "expo-router/react-navigation";
import { useRef, useState } from "react";
import { type LayoutChangeEvent, Platform } from "react-native";

type Size = { width: number; height: number };

// Absorbs subpixel rounding between the frame and the content height.
const TOLERANCE = 1;

/**
 * Fits a scroll screen below the header. Only the iOS header is translucent;
 * its room is padding inside the content, because an automatic content inset
 * would add it on top of a full height content and make the screen scroll.
 * compact turns true once the content measured at the current frame width is
 * taller than the frame, and holds until the frame width changes.
 */
export const useFitToScreen = () => {
  const headerHeight = useHeaderHeight();
  const headerRoom = Platform.OS === "ios" ? headerHeight : 0;
  const frame = useRef<Size>({ width: 0, height: 0 });
  const content = useRef<Size>({ width: 0, height: 0 });
  const [frameWidth, setFrameWidth] = useState(0);
  const [compactWidth, setCompactWidth] = useState<number | null>(null);

  const checkOverflow = () => {
    const measuredAtFrameWidth = content.current.width === frame.current.width;
    if (
      measuredAtFrameWidth &&
      frame.current.height > 0 &&
      content.current.height > frame.current.height + TOLERANCE
    ) {
      setCompactWidth(frame.current.width);
    }
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    frame.current = { width, height };
    setFrameWidth(width);
    checkOverflow();
  };

  const onContentSizeChange = (width: number, height: number) => {
    content.current = { width, height };
    checkOverflow();
  };

  return {
    compact: compactWidth !== null && compactWidth === frameWidth,
    contentContainerStyle: { flexGrow: 1, paddingTop: headerRoom },
    scrollIndicatorInsets: { top: headerRoom },
    onLayout,
    onContentSizeChange,
  };
};
