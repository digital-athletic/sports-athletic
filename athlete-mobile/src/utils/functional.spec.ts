import { pipe, when } from "./functional";

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
