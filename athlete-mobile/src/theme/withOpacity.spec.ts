import { withOpacity } from "./withOpacity";

describe("withOpacity: hex colors", () => {
  it("converts a six digit hex color", () => {
    expect(withOpacity("#0058BC", 0.08)).toBe("rgba(0, 88, 188, 0.08)");
  });

  it("expands a three digit hex color", () => {
    expect(withOpacity("#FFF", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });
});
