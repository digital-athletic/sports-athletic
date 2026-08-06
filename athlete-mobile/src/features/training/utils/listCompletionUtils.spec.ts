import { getIncompleteCount } from "./listCompletionUtils";

describe("getIncompleteCount", () => {
  it("returns the full count when nothing is completed", () => {
    expect(getIncompleteCount([0, 1, 2], [])).toBe(3);
  });

  it("returns zero when all rows are completed", () => {
    expect(getIncompleteCount([0, 1, 2], [0, 1, 2])).toBe(0);
  });

  it("counts only rows not present in completedIndices", () => {
    expect(getIncompleteCount([0, 1, 2, 3], [1, 3])).toBe(2);
  });

  it("ignores completed indices that are not part of the row list", () => {
    expect(getIncompleteCount([0, 1], [5, 6])).toBe(2);
  });

  it("returns zero for an empty row list", () => {
    expect(getIncompleteCount([], [])).toBe(0);
  });
});
