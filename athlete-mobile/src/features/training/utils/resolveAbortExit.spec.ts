import { resolveAbortExit } from "./resolveAbortExit";

describe("resolveAbortExit", () => {
  describe("with the selection screen in the stack", () => {
    it.each([
      {
        name: "plan, focus or prevention workout",
        routes: [
          "new",
          "muscle-soreness",
          "training-overview",
          "training-list",
        ],
      },
      {
        name: "power test started from the plan selection",
        routes: ["new", "muscle-soreness", "training-list"],
      },
    ])("returns SELECTION for a $name", ({ routes }) => {
      expect(resolveAbortExit(routes, true)).toBe("SELECTION");
    });

    it("returns SELECTION even when the parent cannot go back", () => {
      expect(resolveAbortExit(["new", "training-list"], false)).toBe(
        "SELECTION",
      );
    });
  });

  describe("without the selection screen in the stack", () => {
    it.each([
      {
        name: "custom workout opened from a workout list",
        routes: ["muscle-soreness", "training-overview", "training-list"],
      },
      {
        name: "power test opened from Statistics or More",
        routes: ["muscle-soreness", "training-list"],
      },
    ])(
      "returns ORIGIN for a $name when the parent can go back",
      ({ routes }) => {
        expect(resolveAbortExit(routes, true)).toBe("ORIGIN");
      },
    );

    it("returns HOME for a resumed checklist with no screen below", () => {
      expect(resolveAbortExit(["training-list"], false)).toBe("HOME");
    });

    it("returns HOME when the stack is empty and the parent cannot go back", () => {
      expect(resolveAbortExit([], false)).toBe("HOME");
    });
  });
});
