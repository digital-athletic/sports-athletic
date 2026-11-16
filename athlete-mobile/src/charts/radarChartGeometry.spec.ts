import { buildRadarGeometry } from "./radarChartGeometry";

// Builds a geometry input for a 200 wide chart with 6 axes: { values: [50, 25, 0, 50, 50, 50], maxValue: 50, sections: 2, size: 200, labelOffset: 15 }
const generateRadarInput = (
  overrides: Partial<Parameters<typeof buildRadarGeometry>[0]> = {},
): Parameters<typeof buildRadarGeometry>[0] => ({
  values: [50, 25, 0, 50, 50, 50],
  maxValue: 50,
  sections: 2,
  size: 200,
  labelOffset: 15,
  ...overrides,
});

describe("buildRadarGeometry: center", () => {
  it("places the center at half the size on both axes", () => {
    const geometry = buildRadarGeometry(generateRadarInput({ size: 220 }));

    expect(geometry.center).toEqual({ x: 110, y: 110 });
  });
});

describe("buildRadarGeometry: polygon", () => {
  it("returns one polygon point per value", () => {
    const geometry = buildRadarGeometry(generateRadarInput());

    expect(geometry.polygon).toHaveLength(6);
  });

  it("puts the first axis straight up from the center", () => {
    const geometry = buildRadarGeometry(generateRadarInput());

    expect(geometry.polygon[0].x).toBeCloseTo(100);
    expect(geometry.polygon[0].y).toBeCloseTo(0);
  });

  it("puts the second axis at 60 degrees clockwise from up", () => {
    const geometry = buildRadarGeometry(
      generateRadarInput({ values: [50, 50, 50, 50, 50, 50] }),
    );

    expect(geometry.polygon[1].x).toBeCloseTo(
      100 + 100 * Math.sin(Math.PI / 3),
    );
    expect(geometry.polygon[1].y).toBeCloseTo(
      100 - 100 * Math.cos(Math.PI / 3),
    );
  });

  it("puts the fourth axis straight down from the center", () => {
    const geometry = buildRadarGeometry(generateRadarInput());

    expect(geometry.polygon[3].x).toBeCloseTo(100);
    expect(geometry.polygon[3].y).toBeCloseTo(200);
  });

  it("puts the sixth axis at 60 degrees counter clockwise from up", () => {
    const geometry = buildRadarGeometry(
      generateRadarInput({ values: [50, 50, 50, 50, 50, 50] }),
    );

    expect(geometry.polygon[5].x).toBeCloseTo(
      100 - 100 * Math.sin(Math.PI / 3),
    );
    expect(geometry.polygon[5].y).toBeCloseTo(
      100 - 100 * Math.cos(Math.PI / 3),
    );
  });

  it("scales the radius by value divided by maxValue", () => {
    const geometry = buildRadarGeometry(generateRadarInput());

    // value 25 of 50 on the second axis is half of the 100 radius
    expect(geometry.polygon[1].x).toBeCloseTo(100 + 50 * Math.sin(Math.PI / 3));
    expect(geometry.polygon[1].y).toBeCloseTo(100 - 50 * Math.cos(Math.PI / 3));
  });

  it("collapses a zero value onto the center", () => {
    const geometry = buildRadarGeometry(generateRadarInput());

    expect(geometry.polygon[2].x).toBeCloseTo(100);
    expect(geometry.polygon[2].y).toBeCloseTo(100);
  });

  it("clamps values above maxValue to the outer radius", () => {
    const geometry = buildRadarGeometry(
      generateRadarInput({ values: [500, 0, 0, 0, 0, 0] }),
    );

    expect(geometry.polygon[0].x).toBeCloseTo(100);
    expect(geometry.polygon[0].y).toBeCloseTo(0);
  });

  it("clamps negative values to the center", () => {
    const geometry = buildRadarGeometry(
      generateRadarInput({ values: [-20, 0, 0, 0, 0, 0] }),
    );

    expect(geometry.polygon[0].x).toBeCloseTo(100);
    expect(geometry.polygon[0].y).toBeCloseTo(100);
  });
});

describe("buildRadarGeometry: grid radii", () => {
  it("returns evenly spaced radii up to half the size", () => {
    const geometry = buildRadarGeometry(generateRadarInput({ sections: 4 }));

    expect(geometry.gridRadii).toEqual([25, 50, 75, 100]);
  });

  it("returns a single outer radius for one section", () => {
    const geometry = buildRadarGeometry(generateRadarInput({ sections: 1 }));

    expect(geometry.gridRadii).toEqual([100]);
  });
});

describe("buildRadarGeometry: axis ends", () => {
  it("returns one axis end per value on the outer radius", () => {
    const geometry = buildRadarGeometry(generateRadarInput());

    expect(geometry.axisEnds).toHaveLength(6);
    geometry.axisEnds.forEach((end) => {
      expect(Math.hypot(end.x - 100, end.y - 100)).toBeCloseTo(100);
    });
  });

  it("puts the first axis end at the top of the chart", () => {
    const geometry = buildRadarGeometry(generateRadarInput());

    expect(geometry.axisEnds[0].x).toBeCloseTo(100);
    expect(geometry.axisEnds[0].y).toBeCloseTo(0);
  });
});

describe("buildRadarGeometry: label anchors", () => {
  it("places each anchor labelOffset beyond the outer radius", () => {
    const geometry = buildRadarGeometry(generateRadarInput());

    expect(geometry.labelAnchors).toHaveLength(6);
    geometry.labelAnchors.forEach((anchor) => {
      expect(Math.hypot(anchor.x - 100, anchor.y - 100)).toBeCloseTo(115);
    });
  });

  it("puts the first anchor above the top of the chart", () => {
    const geometry = buildRadarGeometry(generateRadarInput());

    expect(geometry.labelAnchors[0].x).toBeCloseTo(100);
    expect(geometry.labelAnchors[0].y).toBeCloseTo(-15);
  });

  it("puts the fourth anchor below the bottom of the chart", () => {
    const geometry = buildRadarGeometry(generateRadarInput());

    expect(geometry.labelAnchors[3].x).toBeCloseTo(100);
    expect(geometry.labelAnchors[3].y).toBeCloseTo(215);
  });
});
