import { type LayoutChangeEvent } from "react-native";

/**
 * Builds the event a view passes to onLayout, for a frame of the given size.
 *
 * generateLayoutEvent(375, 554) → { nativeEvent: { layout: { x: 0, y: 0, width: 375, height: 554 } } }
 */
export const generateLayoutEvent = (
  width: number,
  height: number,
): LayoutChangeEvent =>
  ({
    nativeEvent: { layout: { x: 0, y: 0, width, height } },
  }) as LayoutChangeEvent;
