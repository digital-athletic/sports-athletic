import { getHexagonPoints } from "./geometry";

describe("getHexagonPoints", () => {
  it("returns 6 coordinate pairs in x,y format", () => {
    const points = getHexagonPoints(100);
    const pairs = points.split(" ");

    expect(pairs).toHaveLength(6);
    expect(pairs.every((p) => /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(p))).toBe(
      true,
    );
  });

  it("produces correct hexagon for size 100 with default border inset", () => {
    const points = getHexagonPoints(100);
    const pairs = points.split(" ").map((p) => {
      const [x, y] = p.split(",").map(Number);
      return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
    });

    // Center is at 50, radius is 49 (size/2 - borderInset=1)
    // Starting at 30 degrees (PI/6), vertices at 60-degree intervals
    expect(pairs[0]).toEqual({ x: 92.44, y: 74.5 }); // 30°
    expect(pairs[3]).toEqual({ x: 7.56, y: 25.5 }); // 210° (opposite)
  });

  it("produces smaller hexagon with larger border inset", () => {
    const defaultPoints = getHexagonPoints(100, 1);
    const largeInsetPoints = getHexagonPoints(100, 10);

    // Parse first point's distance from center
    const parseFirstPointRadius = (points: string) => {
      const [x, y] = points.split(" ")[0].split(",").map(Number);
      return Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
    };

    expect(parseFirstPointRadius(largeInsetPoints)).toBeLessThan(
      parseFirstPointRadius(defaultPoints),
    );
  });

  it("handles edge case of very small size", () => {
    const points = getHexagonPoints(2);

    expect(points.split(" ")).toHaveLength(6);
  });
});
