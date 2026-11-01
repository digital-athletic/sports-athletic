import { generateDerivedProfile } from "@test/factories/derivedProfile";
import {
  generateSectionEntry,
  generateSectionTemplate,
  generateSectionTemplates,
} from "@test/factories/sectionTemplates";
import { catchThrownValue } from "@test/factories/thrownValue";
import { layOutSections } from "./sectionLayout";

const explosivePower = generateSectionEntry({ type: "SK", numOfWeeks: 8 });
const templateWithExplosivePower = generateSectionTemplate({
  sectionsByWeeks: { 8: [explosivePower] },
});

describe("layOutSections", () => {
  describe("template selection", () => {
    it("picks the template of the season phase, age group and fitness level", () => {
      const templates = generateSectionTemplates({
        "competition/adult/beginner": templateWithExplosivePower,
      });
      const profile = generateDerivedProfile({
        fitnessLevel: "BEGINNER",
        seasonPhase: { type: "COMPETITION", weekCount: 8 },
      });

      expect(layOutSections(profile, templates)).toEqual([explosivePower]);
    });

    it("picks the child template for a child", () => {
      const templates = generateSectionTemplates({
        "preparatory/child/advanced": templateWithExplosivePower,
      });
      const profile = generateDerivedProfile({ ageGroup: "CHILD" });

      expect(layOutSections(profile, templates)).toEqual([explosivePower]);
    });

    it("picks the adult template for an adolescent", () => {
      const templates = generateSectionTemplates({
        "pause/adult/advanced": templateWithExplosivePower,
      });
      const profile = generateDerivedProfile({
        ageGroup: "ADOLESCENT",
        seasonPhase: { type: "PAUSE", weekCount: 8 },
      });

      expect(layOutSections(profile, templates)).toEqual([explosivePower]);
    });

    it("falls back to the preparatory adult advanced template", () => {
      const templates = generateSectionTemplates({
        "preparatory/adult/advanced": templateWithExplosivePower,
      });
      const profile = generateDerivedProfile({
        fitnessLevel: "PROFESSIONAL",
        seasonPhase: { type: "COMPETITION", weekCount: 8 },
      });

      expect(layOutSections(profile, templates)).toEqual([explosivePower]);
    });

    it("raises a configuration error without a matching or fallback template", () => {
      const profile = generateDerivedProfile();

      expect(catchThrownValue(() => layOutSections(profile, {}))).toEqual({
        type: "OTHER",
        subtype: "OTHER",
        params: ["sectionTemplate", "preparatory/adult/advanced", "8"],
      });
    });
  });

  describe("phases longer than 20 weeks", () => {
    it("appends from the repeat list cyclically after the 20-week entry", () => {
      const templates = generateSectionTemplates({
        "preparatory/adult/advanced": generateSectionTemplate({
          sectionsByWeeks: {
            20: [generateSectionEntry({ type: "SWR1", numOfWeeks: 20 })],
          },
          repeat: [
            generateSectionEntry({
              type: "SK",
              numOfWeeks: 3,
              cardioType: "CARDIO_3",
            }),
            generateSectionEntry({ type: "SWR2", numOfWeeks: 2 }),
          ],
        }),
      });
      const profile = generateDerivedProfile({
        seasonPhase: { type: "PREPARATORY", weekCount: 27 },
      });

      expect(layOutSections(profile, templates)).toEqual([
        generateSectionEntry({ type: "SWR1", numOfWeeks: 20 }),
        generateSectionEntry({
          type: "SK",
          numOfWeeks: 3,
          cardioType: "CARDIO_3",
        }),
        generateSectionEntry({ type: "SWR2", numOfWeeks: 2 }),
        generateSectionEntry({
          type: "SK",
          numOfWeeks: 2,
          cardioType: "CARDIO_3",
        }),
      ]);
    });

    it("merges an appended section into the previous one when type and cardio type match", () => {
      const templates = generateSectionTemplates({
        "preparatory/adult/advanced": generateSectionTemplate({
          sectionsByWeeks: {
            20: [
              generateSectionEntry({ type: "SWR1", numOfWeeks: 17 }),
              generateSectionEntry({ type: "SK", numOfWeeks: 3 }),
            ],
          },
          repeat: [
            generateSectionEntry({ type: "SK", numOfWeeks: 3 }),
            generateSectionEntry({
              type: "SK",
              numOfWeeks: 2,
              cardioType: "CARDIO_4",
            }),
          ],
        }),
      });
      const profile = generateDerivedProfile({
        seasonPhase: { type: "PREPARATORY", weekCount: 25 },
      });

      expect(layOutSections(profile, templates)).toEqual([
        generateSectionEntry({ type: "SWR1", numOfWeeks: 17 }),
        generateSectionEntry({ type: "SK", numOfWeeks: 6 }),
        generateSectionEntry({
          type: "SK",
          numOfWeeks: 2,
          cardioType: "CARDIO_4",
        }),
      ]);
    });
  });

  describe("max strength substitution", () => {
    const maxStrengthTemplate = generateSectionTemplate({
      sectionsByWeeks: {
        8: [
          generateSectionEntry({ type: "MAX", numOfWeeks: 4 }),
          generateSectionEntry({ type: "MAX_STRENGTH", numOfWeeks: 4 }),
        ],
      },
    });
    const maxStrengthTemplates = generateSectionTemplates({
      "preparatory/adult/beginner": maxStrengthTemplate,
      "preparatory/child/advanced": maxStrengthTemplate,
      "preparatory/adult/advanced": maxStrengthTemplate,
    });

    it.each([
      ["without weights", generateDerivedProfile({ hasWeights: false })],
      ["for a beginner", generateDerivedProfile({ fitnessLevel: "BEGINNER" })],
      ["for a child", generateDerivedProfile({ ageGroup: "CHILD" })],
    ])("turns max strength into hypertrophy stage 2 %s", (_, profile) => {
      expect(layOutSections(profile, maxStrengthTemplates)).toEqual([
        generateSectionEntry({ type: "SWR2", numOfWeeks: 4 }),
        generateSectionEntry({ type: "SWR2", numOfWeeks: 4 }),
      ]);
    });

    it("keeps max strength for an advanced adult with weights", () => {
      const profile = generateDerivedProfile();

      expect(layOutSections(profile, maxStrengthTemplates)).toEqual([
        generateSectionEntry({ type: "MAX", numOfWeeks: 4 }),
        generateSectionEntry({ type: "MAX_STRENGTH", numOfWeeks: 4 }),
      ]);
    });
  });

  describe("goalkeeper substitution", () => {
    const powerEnduranceTemplates = generateSectionTemplates({
      "preparatory/adult/advanced": generateSectionTemplate({
        sectionsByWeeks: {
          8: [
            generateSectionEntry({
              type: "SA",
              numOfWeeks: 4,
              cardioType: "CARDIO_1_LAKTAT",
            }),
            generateSectionEntry({ type: "SAKG", numOfWeeks: 4 }),
          ],
        },
      }),
    });

    it("gives goalkeepers explosive power and sprint intervals", () => {
      const profile = generateDerivedProfile({
        playingPositionGroup: "GOALKEEPER",
      });

      expect(layOutSections(profile, powerEnduranceTemplates)).toEqual([
        generateSectionEntry({
          type: "SK",
          numOfWeeks: 4,
          cardioType: "CARDIO_1_SHORT",
        }),
        generateSectionEntry({ type: "SKKG", numOfWeeks: 4 }),
      ]);
    });

    it("keeps power endurance and lactate intervals for field players", () => {
      const profile = generateDerivedProfile();

      expect(layOutSections(profile, powerEnduranceTemplates)).toEqual([
        generateSectionEntry({
          type: "SA",
          numOfWeeks: 4,
          cardioType: "CARDIO_1_LAKTAT",
        }),
        generateSectionEntry({ type: "SAKG", numOfWeeks: 4 }),
      ]);
    });
  });
});
