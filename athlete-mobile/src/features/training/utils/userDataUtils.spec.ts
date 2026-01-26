import type { UserType } from "@/schemas/user.schema";
import {
  getTemporalData,
  getTemporalTags,
  requireTrainingPlan,
  hasTrainingPlan,
  requireWorkoutData,
  hasWorkoutData,
} from "./userDataUtils";

const createMockUser = (overrides: Partial<UserType> = {}): UserType => ({
  userId: "test-user",
  ...overrides,
});

describe("userDataUtils", () => {
  describe("getTemporalData", () => {
    it("returns empty array when temporalData is undefined", () => {
      const user = createMockUser({ temporalData: undefined });

      const result = getTemporalData(user);

      expect(result).toEqual([]);
    });

    it("converts string dates to Date objects", () => {
      const user = createMockUser({
        temporalData: [
          {
            tag: "SORENESS_ARM",
            date: "2024-01-01",
            expiration: "2024-01-03",
          },
        ],
      });

      const result = getTemporalData(user);

      expect(result).toHaveLength(1);
      expect(result[0].tag).toBe("SORENESS_ARM");
      expect(result[0].date).toBeInstanceOf(Date);
      expect(result[0].expiration).toBeInstanceOf(Date);
    });

    it("preserves Date objects if already Date", () => {
      const dateObj = new Date("2024-01-01");
      const expirationObj = new Date("2024-01-03");
      const user = createMockUser({
        temporalData: [
          {
            tag: "SORENESS_LEG",
            date: dateObj,
            expiration: expirationObj,
          },
        ],
      });

      const result = getTemporalData(user);

      expect(result[0].date).toBe(dateObj);
      expect(result[0].expiration).toBe(expirationObj);
    });
  });

  describe("getTemporalTags", () => {
    it("returns empty array when temporalData is undefined", () => {
      const user = createMockUser({ temporalData: undefined });

      const result = getTemporalTags(user);

      expect(result).toEqual([]);
    });

    it("returns array of tags", () => {
      const user = createMockUser({
        temporalData: [
          { tag: "SORENESS_ARM", date: new Date(), expiration: new Date() },
          { tag: "SORENESS_LEG", date: new Date(), expiration: new Date() },
        ],
      });

      const result = getTemporalTags(user);

      expect(result).toEqual(["SORENESS_ARM", "SORENESS_LEG"]);
    });
  });

  describe("requireTrainingPlan", () => {
    it("returns training plan when present", () => {
      const user = createMockUser({
        trainingPlan: {
          start: new Date(),
          sections: [
            {
              start: "2024-01-01",
              numOfWeeks: 4,
              type: "SK",
              cardioType: "CARDIO_1",
              trainings: [],
            },
          ],
        },
      });

      const result = requireTrainingPlan(user);

      expect(result.sections).toHaveLength(1);
    });

    it("throws when trainingPlan is null", () => {
      const user = createMockUser({ trainingPlan: null });

      expect(() => requireTrainingPlan(user)).toThrow();
    });

    it("throws when trainingPlan is undefined", () => {
      const user = createMockUser({ trainingPlan: undefined });

      expect(() => requireTrainingPlan(user)).toThrow();
    });

    it("throws when sections is empty", () => {
      const user = createMockUser({
        trainingPlan: {
          start: new Date(),
          sections: [],
        },
      });

      expect(() => requireTrainingPlan(user)).toThrow();
    });
  });

  describe("hasTrainingPlan", () => {
    it("returns true when training plan exists with sections", () => {
      const user = createMockUser({
        trainingPlan: {
          start: new Date(),
          sections: [
            {
              start: "2024-01-01",
              numOfWeeks: 4,
              type: "SK",
              cardioType: "CARDIO_1",
              trainings: [],
            },
          ],
        },
      });

      expect(hasTrainingPlan(user)).toBe(true);
    });

    it("returns false when trainingPlan is null", () => {
      const user = createMockUser({ trainingPlan: null });

      expect(hasTrainingPlan(user)).toBe(false);
    });

    it("returns false when trainingPlan is undefined", () => {
      const user = createMockUser({ trainingPlan: undefined });

      expect(hasTrainingPlan(user)).toBe(false);
    });

    it("returns false when sections is empty", () => {
      const user = createMockUser({
        trainingPlan: {
          start: new Date(),
          sections: [],
        },
      });

      expect(hasTrainingPlan(user)).toBe(false);
    });
  });

  describe("requireWorkoutData", () => {
    it("returns workoutData when present", () => {
      const user = createMockUser({
        workoutData: {
          gender: "MALE",
          anamnesisCompleted: true,
        },
      });

      const result = requireWorkoutData(user);

      expect(result.gender).toBe("MALE");
    });

    it("throws when workoutData is undefined", () => {
      const user = createMockUser({ workoutData: undefined });

      expect(() => requireWorkoutData(user)).toThrow();
    });
  });

  describe("hasWorkoutData", () => {
    it("returns true when workoutData exists", () => {
      const user = createMockUser({
        workoutData: {
          gender: "FEMALE",
        },
      });

      expect(hasWorkoutData(user)).toBe(true);
    });

    it("returns false when workoutData is undefined", () => {
      const user = createMockUser({ workoutData: undefined });

      expect(hasWorkoutData(user)).toBe(false);
    });
  });
});
