import { filterRecord, mapReduce, pipe, when } from "./functional";

describe("functional: pipe", () => {
  it("returns the value unchanged when no step is given", () => {
    expect(pipe(3)).toBe(3);
  });

  it("applies the steps from left to right", () => {
    const steps = [
      (value: string) => `${value}a`,
      (value: string) => `${value}b`,
      (value: string) => `${value}c`,
    ];
    expect(pipe("", ...steps)).toBe("abc");
  });
});

describe("functional: when", () => {
  const double = (value: number) => value * 2;

  it("applies the step when the condition holds", () => {
    expect(pipe(3, when(true, double))).toBe(6);
  });

  it("skips the step when the condition fails", () => {
    expect(pipe(3, when(false, double))).toBe(3);
  });
});

describe("functional: mapReduce", () => {
  it("returns no results and the initial state for an empty list", () => {
    expect(
      mapReduce([], 7, (item: number, sum: number) => [item, sum]),
    ).toEqual([[], 7]);
  });

  it("maps each item with the state the items before it passed on", () => {
    const runningTotals = mapReduce(
      [1, 2, 3],
      0,
      (item, sum) => [sum + item, sum + item] as const,
    );
    expect(runningTotals).toEqual([[1, 3, 6], 6]);
  });
});

describe("functional: filterRecord", () => {
  it("keeps the entries whose value passes the check", () => {
    expect(filterRecord({ a: 1, b: 2, c: 3 }, (value) => value > 1)).toEqual({
      b: 2,
      c: 3,
    });
  });

  it("passes the key of each entry to the check", () => {
    expect(filterRecord({ a: 1, b: 2 }, (_, key) => key === "a")).toEqual({
      a: 1,
    });
  });
});
