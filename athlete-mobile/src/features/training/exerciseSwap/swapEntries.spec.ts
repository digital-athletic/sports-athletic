import { generateSessionEntry } from "@test/factories/swapSession";
import { replaceSessionBranch } from "./swapEntries";

describe("replaceSessionBranch: swap and restore", () => {
  it("writes the given entries at the set positions of the branch", () => {
    const entries = [
      generateSessionEntry("10", "e10", "SK", [1, 3]),
      generateSessionEntry("10", "e10", "SK", [2, 3]),
    ];
    const other = generateSessionEntry("5", "e5");
    const session = [
      generateSessionEntry("20", "e20", "SK", [1, 2]),
      other,
      generateSessionEntry("20", "e20", "SK", [2, 2]),
    ];

    const replaced = replaceSessionBranch(session, "20", entries);

    expect(replaced).toEqual([
      { ...entries[0], set: [1, 2] },
      other,
      { ...entries[1], set: [2, 2] },
    ]);
  });

  it("returns null when the entries differ in number from the branch", () => {
    const session = [
      generateSessionEntry("20", "e20", "SK", [1, 2]),
      generateSessionEntry("20", "e20", "SK", [2, 2]),
    ];
    const entries = [generateSessionEntry("10", "e10", "SK", [1, 3])];

    expect(replaceSessionBranch(session, "20", entries)).toBeNull();
  });

  it("returns null when the branch is not in the session", () => {
    const session = [generateSessionEntry("20", "e20")];
    const entries = [generateSessionEntry("10", "e10")];

    expect(replaceSessionBranch(session, "30", entries)).toBeNull();
  });

  it("returns null for empty entries", () => {
    const session = [generateSessionEntry("20", "e20")];

    expect(replaceSessionBranch(session, "20", [])).toBeNull();
  });

  it("returns null when a written entry trains an exercise of another branch", () => {
    const session = [
      generateSessionEntry("20", "e20"),
      generateSessionEntry("5", "e5"),
    ];
    // branch 5 of the session already trains e5
    const entries = [generateSessionEntry("30", "e5")];

    expect(replaceSessionBranch(session, "20", entries)).toBeNull();
  });
});
