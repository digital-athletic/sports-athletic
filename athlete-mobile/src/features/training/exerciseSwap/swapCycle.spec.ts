import { nextSwapPosition } from "./swapCycle";

describe("swapCycle: nextSwapPosition", () => {
  it("moves from the original to the first alternative", () => {
    expect(nextSwapPosition(0, 3)).toBe(1);
  });

  it("moves through the alternatives in order", () => {
    expect(nextSwapPosition(2, 3)).toBe(3);
  });

  it("returns to the original after the last alternative", () => {
    expect(nextSwapPosition(3, 3)).toBe(0);
  });

  it("toggles between original and a single alternative", () => {
    expect(nextSwapPosition(1, 1)).toBe(0);
  });

  it("stays on the original without alternatives", () => {
    expect(nextSwapPosition(0, 0)).toBe(0);
  });
});
