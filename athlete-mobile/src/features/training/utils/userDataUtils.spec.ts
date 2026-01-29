import type { UserType } from "@/schemas/user.schema";
import {
  getTemporalData,
  getTemporalTags,
  requireTrainingPlan,
  hasTrainingPlan,
  requireWorkoutData,
  hasWorkoutData,
  getUserHeight,
  getUserWeight,
  getUserBirthday,
  getUserGender,
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

    it("returns temporal data with string dates", () => {
      const user = createMockUser({
        temporalData: [
          {
            tag: "SORENESS_ARM",
            date: "2024-01-01T00:00:00.000Z",
            expiration: "2024-01-03T00:00:00.000Z",
          },
        ],
      });

      const result = getTemporalData(user);

      expect(result).toHaveLength(1);
      expect(result[0].tag).toBe("SORENESS_ARM");
      expect(typeof result[0].date).toBe("string");
      expect(typeof result[0].expiration).toBe("string");
    });

    it("preserves ISO strings if already string", () => {
      const dateStr = "2024-01-01T00:00:00.000Z";
      const expirationStr = "2024-01-03T00:00:00.000Z";
      const user = createMockUser({
        temporalData: [
          {
            tag: "SORENESS_LEG",
            date: dateStr,
            expiration: expirationStr,
          },
        ],
      });

      const result = getTemporalData(user);

      expect(result[0].date).toBe(dateStr);
      expect(result[0].expiration).toBe(expirationStr);
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
          {
            tag: "SORENESS_ARM",
            date: "2024-01-01T00:00:00.000Z",
            expiration: "2024-01-03T00:00:00.000Z",
          },
          {
            tag: "SORENESS_LEG",
            date: "2024-01-01T00:00:00.000Z",
            expiration: "2024-01-03T00:00:00.000Z",
          },
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
          start: "2024-01-01T00:00:00.000Z",
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
          start: "2024-01-01T00:00:00.000Z",
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
          start: "2024-01-01T00:00:00.000Z",
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
          start: "2024-01-01T00:00:00.000Z",
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

  describe("getUserHeight", () => {
    it("returns height from personalData when available", () => {
      const user = createMockUser({
        personalData: {
          username: "test",
          gender: "MALE",
          birthday: "1990-01-01",
          height: 180,
        },
      });

      const result = getUserHeight(user);

      expect(result).toBe(180);
    });

    it("returns default 175 when personalData.height is undefined", () => {
      const user = createMockUser({
        personalData: {
          username: "test",
          gender: "MALE",
          birthday: "1990-01-01",
        },
      });

      const result = getUserHeight(user);

      expect(result).toBe(175);
    });
  });

  describe("getUserWeight", () => {
    it("returns weight from personalData when available", () => {
      const user = createMockUser({
        personalData: {
          username: "test",
          gender: "MALE",
          birthday: "1990-01-01",
          weight: 80,
        },
      });

      const result = getUserWeight(user);

      expect(result).toBe(80);
    });

    it("returns default 65 when personalData.weight is undefined", () => {
      const user = createMockUser({
        personalData: {
          username: "test",
          gender: "MALE",
          birthday: "1990-01-01",
        },
      });

      const result = getUserWeight(user);

      expect(result).toBe(65);
    });
  });

  describe("getUserBirthday", () => {
    it("returns birthday from personalData when available", () => {
      const user = createMockUser({
        personalData: {
          username: "test",
          gender: "MALE",
          birthday: "1990-06-15",
        },
      });

      const result = getUserBirthday(user);

      expect(result).toBe("1990-06-15");
    });

    it("returns empty string when personalData.birthday is undefined", () => {
      const user = createMockUser({});

      const result = getUserBirthday(user);

      expect(result).toBe("");
    });
  });

  describe("getUserGender", () => {
    it("returns gender from personalData when available", () => {
      const user = createMockUser({
        personalData: {
          username: "test",
          gender: "FEMALE",
          birthday: "1990-01-01",
        },
      });

      const result = getUserGender(user);

      expect(result).toBe("FEMALE");
    });

    it("returns FEMALE as default when personalData.gender is undefined", () => {
      const user = createMockUser({});

      const result = getUserGender(user);

      expect(result).toBe("FEMALE");
    });
  });
});
