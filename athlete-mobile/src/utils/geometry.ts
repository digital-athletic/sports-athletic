/** Default inset from edge to account for stroke width */
const DEFAULT_BORDER_INSET = 1;

/**
 * Generates SVG polygon points for a regular hexagon.
 * Uses flat-top orientation (first vertex at 30 degrees).
 *
 * @param size - The diameter of the hexagon
 * @param borderInset - Inset from edge for stroke width (default: 1)
 * @returns SVG points string (e.g., "x1,y1 x2,y2 ...")
 */
export const getHexagonPoints = (
  size: number,
  borderInset = DEFAULT_BORDER_INSET,
): string => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - borderInset;
  const points: string[] = [];

  // 6 vertices at 60-degree intervals (PI/3 radians)
  // Starting at 30 degrees (PI/6) for flat-top hexagon orientation
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 6 + (i * Math.PI) / 3;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return points.join(" ");
};
