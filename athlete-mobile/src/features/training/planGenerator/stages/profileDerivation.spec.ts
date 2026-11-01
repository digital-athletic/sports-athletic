import {
  generatePlanAthlete,
  generatePlanGenerationInput,
} from "@test/factories/planGenerationInput";
import { catchThrownValue } from "@test/factories/thrownValue";
import { deriveAthleteProfile } from "./profileDerivation";

describe("deriveAthleteProfile", () => {
  describe("age group", () => {
    it.each([
      ["2026-06-14", "CHILD"],
      ["2026-06-15", "ADOLESCENT"],
      ["2028-06-14", "ADOLESCENT"],
      ["2028-06-15", "ADULT"],
    ])(
      "derives the age group on %s from the birthday 2010-06-15 as %s",
      (referenceDate, ageGroup) => {
        const input = generatePlanGenerationInput({
          athlete: generatePlanAthlete({ birthday: "2010-06-15" }),
          referenceDate,
        });

        expect(deriveAthleteProfile(input).ageGroup).toBe(ageGroup);
      },
    );

    it("counts a missing birthday as ADULT", () => {
      const input = generatePlanGenerationInput({
        athlete: generatePlanAthlete({ birthday: "" }),
      });

      expect(deriveAthleteProfile(input).ageGroup).toBe("ADULT");
    });
  });

  describe("fitness level", () => {
    it("downgrades a professional child to ADVANCED", () => {
      const input = generatePlanGenerationInput({
        athlete: generatePlanAthlete({
          birthday: "2012-01-01",
          tags: { LEVEL: ["PROFESSIONAL"] },
        }),
      });

      expect(deriveAthleteProfile(input).fitnessLevel).toBe("ADVANCED");
    });

    it("keeps a professional adult at PROFESSIONAL", () => {
      const input = generatePlanGenerationInput({
        athlete: generatePlanAthlete({ tags: { LEVEL: ["PROFESSIONAL"] } }),
      });

      expect(deriveAthleteProfile(input).fitnessLevel).toBe("PROFESSIONAL");
    });

    it("counts a missing level as BEGINNER", () => {
      const input = generatePlanGenerationInput({
        athlete: generatePlanAthlete({ tags: {} }),
      });

      expect(deriveAthleteProfile(input).fitnessLevel).toBe("BEGINNER");
    });
  });

  describe("pain status and prevention skills", () => {
    it("sets the pain status and maps the pains to prevention skills", () => {
      const input = generatePlanGenerationInput({
        athlete: generatePlanAthlete({
          tags: { PAIN: ["KNEE_LEFT", "HIP_RIGHT", "SHOULDER_LEFT"] },
        }),
      });

      const profile = deriveAthleteProfile(input);

      expect(profile).toMatchObject({
        hasPain: true,
        preventionSkills: ["PREVKNEE", "PREVSHOULDER"],
      });
    });

    it("counts an athlete without pain tags as free of pain", () => {
      const profile = deriveAthleteProfile(generatePlanGenerationInput());

      expect(profile).toMatchObject({ hasPain: false, preventionSkills: [] });
    });
  });

  describe("playing position group", () => {
    it.each([
      ["GOAL", "GOALKEEPER"],
      ["GOALKEEPER", "GOALKEEPER"],
      ["FIELD", "FIELD_PLAYER"],
    ])("puts the position %s into the group %s", (position, group) => {
      const input = generatePlanGenerationInput({
        athlete: generatePlanAthlete({ tags: { POSITION: [position] } }),
      });

      expect(deriveAthleteProfile(input).playingPositionGroup).toBe(group);
    });

    it("counts a missing position as FIELD_PLAYER", () => {
      const input = generatePlanGenerationInput({
        athlete: generatePlanAthlete({ tags: {} }),
      });

      expect(deriveAthleteProfile(input).playingPositionGroup).toBe(
        "FIELD_PLAYER",
      );
    });
  });

  describe("season phase", () => {
    it("counts the full weeks from the plan start to the phase end", () => {
      const input = generatePlanGenerationInput({
        planStartDate: "2026-11-02",
        seasonPhase: { type: "COMPETITION", endDate: "2027-03-07" },
      });

      expect(deriveAthleteProfile(input).seasonPhase).toEqual({
        type: "COMPETITION",
        weekCount: 17,
      });
    });

    it("counts at least one week when the phase ends before the plan start", () => {
      const input = generatePlanGenerationInput({
        planStartDate: "2026-11-02",
        seasonPhase: { type: "PAUSE", endDate: "2026-10-01" },
      });

      expect(deriveAthleteProfile(input).seasonPhase.weekCount).toBe(1);
    });

    it("raises an input error without a season phase", () => {
      const input = generatePlanGenerationInput({
        seasonPhase: { type: null, endDate: "2027-03-01" },
      });

      expect(catchThrownValue(() => deriveAthleteProfile(input))).toEqual({
        type: "NO_ANAMNESIS",
        subtype: "MISSING_WORKOUT_DATA",
        params: ["seasonPhase"],
      });
    });
  });

  describe("weights", () => {
    it("has weights when an active day's training place has weights", () => {
      const profile = deriveAthleteProfile(generatePlanGenerationInput());

      expect(profile.hasWeights).toBe(true);
    });

    it("ignores the weights of training places no active day uses", () => {
      const input = generatePlanGenerationInput({
        trainingPlaces: {
          HOME: { equipment: [] },
          STUDIO: { equipment: ["MAT"] },
          HALL: { equipment: ["BARBELL"] },
          OUTSIDE: { equipment: ["DUMBBELL"] },
        },
      });

      expect(deriveAthleteProfile(input).hasWeights).toBe(false);
    });
  });
});
