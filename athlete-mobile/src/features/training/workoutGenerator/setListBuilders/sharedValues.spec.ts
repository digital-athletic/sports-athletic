import { sharesAnyValue } from "./sharedValues";

describe("sharedValues: sharesAnyValue", () => {
  it("returns true when the lists share a value", () => {
    expect(sharesAnyValue(["A", "B"], ["C", "B"])).toBe(true);
  });

  it("returns false when the lists share no value", () => {
    expect(sharesAnyValue(["A", "B"], ["C", "D"])).toBe(false);
  });

  it("returns false when the first list is empty", () => {
    expect(sharesAnyValue([], ["A"])).toBe(false);
  });

  it("returns false when the second list is empty", () => {
    expect(sharesAnyValue(["A"], [])).toBe(false);
  });

  it("returns false when both lists are empty", () => {
    expect(sharesAnyValue([], [])).toBe(false);
  });
});
