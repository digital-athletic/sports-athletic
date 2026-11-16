import { Platform } from "react-native";

/** A position in the coordinate space of an SVG chart. */
export type ChartPoint = { x: number; y: number };

// The browser renders SVG text in a serif font unless the family is named.
export const SVG_FONT_FAMILY = Platform.select({
  web: "system-ui, -apple-system, sans-serif",
  default: undefined,
});

/** Formats points for the `points` attribute of a polyline or polygon: "0,10 20,5". */
export const toSvgPoints = (points: ChartPoint[]): string =>
  points.map(({ x, y }) => `${x},${y}`).join(" ");
