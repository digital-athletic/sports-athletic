import { rateValue } from "./valueStatus";

describe("rateValue: lower is stronger", () => {
  const sprintRange = { rangeStart: 9.87, rangeEnd: 6.54 };

  it("is in range between start and end", () => {
    expect(rateValue(8.1, sprintRange)).toBe("IN_RANGE");
  });

  it("is in range on the start", () => {
    expect(rateValue(9.87, sprintRange)).toBe("IN_RANGE");
  });

  it("is in range on the end", () => {
    expect(rateValue(6.54, sprintRange)).toBe("IN_RANGE");
  });

  it("is below range when slower than the start", () => {
    expect(rateValue(10.2, sprintRange)).toBe("BELOW_RANGE");
  });

  it("is above range when faster than the end", () => {
    expect(rateValue(6.1, sprintRange)).toBe("ABOVE_RANGE");
  });
});

describe("rateValue: higher is stronger", () => {
  const jumpRange = { rangeStart: 31.5, rangeEnd: 44.25 };

  it("is in range between start and end", () => {
    expect(rateValue(38, jumpRange)).toBe("IN_RANGE");
  });

  it("is in range on the start", () => {
    expect(rateValue(31.5, jumpRange)).toBe("IN_RANGE");
  });

  it("is in range on the end", () => {
    expect(rateValue(44.25, jumpRange)).toBe("IN_RANGE");
  });

  it("is below range when lower than the start", () => {
    expect(rateValue(30.1, jumpRange)).toBe("BELOW_RANGE");
  });

  it("is above range when higher than the end", () => {
    expect(rateValue(45.8, jumpRange)).toBe("ABOVE_RANGE");
  });
});

describe("rateValue: start equals end", () => {
  const singlePointRange = { rangeStart: 7.5, rangeEnd: 7.5 };

  it("is in range when equal", () => {
    expect(rateValue(7.5, singlePointRange)).toBe("IN_RANGE");
  });

  it("is above range when higher", () => {
    expect(rateValue(7.6, singlePointRange)).toBe("ABOVE_RANGE");
  });

  it("is below range when lower", () => {
    expect(rateValue(7.4, singlePointRange)).toBe("BELOW_RANGE");
  });
});
