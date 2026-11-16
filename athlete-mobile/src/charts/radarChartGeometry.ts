export type RadarPoint = { x: number; y: number };

export type RadarGeometryInput = {
  values: number[];
  maxValue: number;
  sections: number;
  size: number;
  labelOffset: number;
};

export type RadarGeometry = {
  center: RadarPoint;
  polygon: RadarPoint[];
  gridRadii: number[];
  axisEnds: RadarPoint[];
  labelAnchors: RadarPoint[];
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Point at `radius` on axis `index`: axis 0 points up, axes run clockwise. */
const pointOnAxis = (
  center: RadarPoint,
  axisCount: number,
  index: number,
  radius: number,
): RadarPoint => {
  const angle = (2 * Math.PI * index) / axisCount;
  return {
    x: center.x + radius * Math.sin(angle),
    y: center.y - radius * Math.cos(angle),
  };
};

export const buildRadarGeometry = ({
  values,
  maxValue,
  sections,
  size,
  labelOffset,
}: RadarGeometryInput): RadarGeometry => {
  const outerRadius = size / 2;
  const center = { x: outerRadius, y: outerRadius };
  const axisCount = values.length;

  const polygon = values.map((value, index) =>
    pointOnAxis(
      center,
      axisCount,
      index,
      (clamp(value, 0, maxValue) / maxValue) * outerRadius,
    ),
  );
  const gridRadii = Array.from(
    { length: sections },
    (_, index) => ((index + 1) / sections) * outerRadius,
  );
  const axisEnds = values.map((_, index) =>
    pointOnAxis(center, axisCount, index, outerRadius),
  );
  const labelAnchors = values.map((_, index) =>
    pointOnAxis(center, axisCount, index, outerRadius + labelOffset),
  );

  return { center, polygon, gridRadii, axisEnds, labelAnchors };
};
