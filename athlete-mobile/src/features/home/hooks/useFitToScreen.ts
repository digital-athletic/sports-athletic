import { useRef, useState } from "react";
import { type LayoutChangeEvent } from "react-native";

type Size = { width: number; height: number };

// Absorbs subpixel rounding between the frame and the content height.
const TOLERANCE = 1;

/**
 * Answers whether a scroll screen needs its compact layout: true once the
 * content measured at the current frame width is taller than the frame. The
 * answer holds until the frame width changes, e.g. on rotation. Assumes opaque
 * bars: under a translucent header the frame is taller than the visible area.
 */
export const useFitToScreen = () => {
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
    onLayout,
    onContentSizeChange,
  };
};
