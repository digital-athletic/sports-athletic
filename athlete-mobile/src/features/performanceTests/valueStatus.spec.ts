import { rateValue } from "./valueStatus";

const sprintRange = { rangeStart: 9.87, rangeEnd: 6.54 };
const jumpRange = { rangeStart: 31.5, rangeEnd: 44.25 };
const singlePointRange = { rangeStart: 7.5, rangeEnd: 7.5 };

describe("rateValue: lower is stronger", () => {
  it.each([
    ["in range between start and end", 8.1, "IN_RANGE"],
    ["in range on the start", 9.87, "IN_RANGE"],
    ["in range on the end", 6.54, "IN_RANGE"],
    ["below range when slower than the start", 10.2, "BELOW_RANGE"],
    ["above range when faster than the end", 6.1, "ABOVE_RANGE"],
  ])("is %s", (_label, value, expected) => {
    expect(rateValue(value, sprintRange)).toBe(expected);
  });
});

describe("rateValue: higher is stronger", () => {
  it.each([
    ["in range between start and end", 38, "IN_RANGE"],
    ["in range on the start", 31.5, "IN_RANGE"],
    ["in range on the end", 44.25, "IN_RANGE"],
    ["below range when lower than the start", 30.1, "BELOW_RANGE"],
    ["above range when higher than the end", 45.8, "ABOVE_RANGE"],
  ])("is %s", (_label, value, expected) => {
    expect(rateValue(value, jumpRange)).toBe(expected);
  });
});

describe("rateValue: start equals end", () => {
  it.each([
    ["in range when equal", 7.5, "IN_RANGE"],
    ["above range when higher", 7.6, "ABOVE_RANGE"],
    ["below range when lower", 7.4, "BELOW_RANGE"],
  ])("is %s", (_label, value, expected) => {
    expect(rateValue(value, singlePointRange)).toBe(expected);
  });
});
