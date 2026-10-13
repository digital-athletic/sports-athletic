import { SharedConstants } from "@/constants/sharedConstants";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { canTakeStrengthTest, isStrengthTestDue } from "./strengthTestUtils";

const DAY = SharedConstants.TIME_IN_MS.DAY;
const now = new Date(2026, 9, 12, 12).getTime();
const { ADULT, ADOLESCENT, CHILD } = WorkoutConstants.AGE_GROUPS;

describe("isStrengthTestDue", () => {
  it("is not due 55 days after the last test", () => {
    expect(isStrengthTestDue(now - 55 * DAY, now, ADULT)).toBe(false);
  });

  it("is due exactly 56 days after the last test", () => {
    expect(isStrengthTestDue(now - 56 * DAY, now, ADULT)).toBe(true);
  });

  it("is due more than 56 days after the last test", () => {
    expect(isStrengthTestDue(now - 90 * DAY, now, ADULT)).toBe(true);
  });

  it("is due when no test was ever completed", () => {
    expect(isStrengthTestDue(0, now, ADULT)).toBe(true);
  });

  it("is due for an adolescent after 56 days", () => {
    expect(isStrengthTestDue(now - 56 * DAY, now, ADOLESCENT)).toBe(true);
  });

  it("is never due for a child without a completed test", () => {
    expect(isStrengthTestDue(0, now, CHILD)).toBe(false);
  });

  it("is never due for a child after 56 days", () => {
    expect(isStrengthTestDue(now - 90 * DAY, now, CHILD)).toBe(false);
  });
});

describe("canTakeStrengthTest", () => {
  it("allows the strength test for adults", () => {
    expect(canTakeStrengthTest(ADULT)).toBe(true);
  });

  it("allows the strength test for adolescents", () => {
    expect(canTakeStrengthTest(ADOLESCENT)).toBe(true);
  });

  it("refuses the strength test for children", () => {
    expect(canTakeStrengthTest(CHILD)).toBe(false);
  });
});
