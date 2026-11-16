import { toSvgPoints } from "./svgChart";

describe("toSvgPoints: points attribute", () => {
  it("joins each point as x,y separated by spaces", () => {
    expect(
      toSvgPoints([
        { x: 0, y: 10 },
        { x: 20.5, y: 5 },
      ]),
    ).toBe("0,10 20.5,5");
  });

  it("returns an empty string without points", () => {
    expect(toSvgPoints([])).toBe("");
  });
});
