import { SharedConstants } from "@/constants/sharedConstants";
import { isStrengthTestDue } from "./strengthTestUtils";

const DAY = SharedConstants.TIME_IN_MS.DAY;
const now = new Date(2026, 9, 12, 12).getTime();

describe("isStrengthTestDue", () => {
  it("is not due 55 days after the last test", () => {
    expect(isStrengthTestDue(now - 55 * DAY, now)).toBe(false);
  });

  it("is due exactly 56 days after the last test", () => {
    expect(isStrengthTestDue(now - 56 * DAY, now)).toBe(true);
  });

  it("is due more than 56 days after the last test", () => {
    expect(isStrengthTestDue(now - 90 * DAY, now)).toBe(true);
  });

  it("is due when no test was ever completed", () => {
    expect(isStrengthTestDue(0, now)).toBe(true);
  });
});
