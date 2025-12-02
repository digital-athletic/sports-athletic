import { WorkoutConstants } from "@/constants/workoutConstants";
import { ageGroupFor } from "./ageUtils";

describe("ageUtils", () => {
  describe("ageGroupFor", () => {
    // Mock Date.now() to return a consistent timestamp for testing
    const mockNow = new Date("2025-11-27").getTime(); // November 27, 2025

    beforeEach(() => {
      jest.spyOn(Date, "now").mockReturnValue(mockNow);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns CHILD for someone under 16 years old", () => {
      // Born in 2015, 10 years old
      const dateOfBirth = "27-11-2015";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.CHILD);
    });

    it("returns CHILD for someone exactly 15 years old", () => {
      // Born in 2010, exactly 15 years old
      const dateOfBirth = "27-11-2010";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.CHILD);
    });

    it("returns ADOLESCENT for someone exactly 16 years old", () => {
      // Born in 2009, exactly 16 years old
      const dateOfBirth = "27-11-2009";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.ADOLESCENT);
    });

    it("returns ADOLESCENT for someone 17 years old", () => {
      // Born in 2008, 17 years old
      const dateOfBirth = "27-11-2008";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.ADOLESCENT);
    });

    it("returns ADULT for someone who turned 18 one day ago", () => {
      // Born on Nov 26, 2007, turned 18 one day before test date (Nov 27, 2025)
      const dateOfBirth = "26-11-2007";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.ADULT);
    });

    it("returns ADULT for someone just over 18 years old", () => {
      // Born in 2007, just turned 18
      const dateOfBirth = "27-11-2007";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.ADULT);
    });

    it("returns ADULT for someone 25 years old", () => {
      // Born in 2000, 25 years old
      const dateOfBirth = "27-11-2000";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.ADULT);
    });

    it("returns ADULT for someone 50 years old", () => {
      // Born in 1975, 50 years old
      const dateOfBirth = "27-11-1975";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.ADULT);
    });

    it("handles dates with different day and month", () => {
      // Born on January 15, 2010 (15 years old in 2025)
      const dateOfBirth = "15-01-2010";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.CHILD);
    });

    it("handles leap year birthdays", () => {
      // Born on February 29, 2008 (17 years old in 2025)
      const dateOfBirth = "29-02-2008";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.ADOLESCENT);
    });

    it("handles birthday not yet reached in current year", () => {
      // Born on December 25, 2009 (birthday hasn't occurred yet in 2025)
      // Still 15 years old until December 25, 2025
      const dateOfBirth = "25-12-2009";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.CHILD);
    });

    it("handles birthday already passed in current year", () => {
      // Born on January 1, 2009 (birthday already occurred in 2025)
      // Already 16 years old
      const dateOfBirth = "01-01-2009";
      const result = ageGroupFor(dateOfBirth);
      expect(result).toBe(WorkoutConstants.AGE_GROUPS.ADOLESCENT);
    });
  });
});
