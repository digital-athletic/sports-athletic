import * as v from "valibot";
import {
  loadSectionTemplate,
  parseSectionTemplate,
} from "./loadSectionTemplates";
import PauseTemplates from "../../assets/data/generator/trainingSections/pause.json";
import { TrainingSectionsMapSchema } from "@/schemas/generator.schema";

const AGE_GROUPS = ["child", "adult"] as const;
const LEVELS = ["beginner", "advanced", "professional"] as const;

describe("loadSectionTemplate", () => {
  it("parses every pause template of the real file", () => {
    for (const ageGroup of AGE_GROUPS) {
      for (const level of LEVELS) {
        expect({
          ageGroup,
          level,
          success: v.safeParse(
            TrainingSectionsMapSchema,
            PauseTemplates[ageGroup][level],
          ).success,
        }).toEqual({ ageGroup, level, success: true });
      }
    }
  });

  it("returns a known template for a known key", () => {
    const template = loadSectionTemplate("PAUSE", "ADULT", "PROFESSIONAL");

    expect(template["9"]).toEqual([
      { type: "SWR1", numOfWeeks: 3, cardioType: "CARDIO_4" },
      { type: "SWR2", numOfWeeks: 3, cardioType: "CARDIO_4" },
      { type: "SWR1", numOfWeeks: 3, cardioType: "CARDIO_4" },
    ]);
    expect(template.repeat).toEqual([
      { type: "SWR2", numOfWeeks: 4, cardioType: "CARDIO_4" },
      { type: "SWR1", numOfWeeks: 4, cardioType: "CARDIO_4" },
    ]);
  });

  it.each(["PAUSE", "PREPARATORY", "COMPETITION"])(
    "resolves every age group and level of %s",
    (seasonPhase) => {
      for (const ageGroup of ["CHILD", "ADULT", "ADOLESCENT"]) {
        for (const level of ["BEGINNER", "ADVANCED", "PROFESSIONAL"]) {
          const template = loadSectionTemplate(seasonPhase, ageGroup, level);

          expect({
            seasonPhase,
            ageGroup,
            level,
            hasTwentyWeeks: (template["20"] ?? []).length > 0,
          }).toEqual({
            seasonPhase,
            ageGroup,
            level,
            hasTwentyWeeks: true,
          });
        }
      }
    },
  );

  it("treats an adolescent as an adult", () => {
    expect(loadSectionTemplate("PAUSE", "ADOLESCENT", "BEGINNER")).toEqual(
      loadSectionTemplate("PAUSE", "ADULT", "BEGINNER"),
    );
  });

  it("falls back to the adult advanced preparatory template for an unknown season phase", () => {
    expect(loadSectionTemplate("OFFSEASON", "CHILD", "BEGINNER")).toEqual(
      loadSectionTemplate("PREPARATORY", "ADULT", "ADVANCED"),
    );
  });

  it("returns a fresh copy that the caller can change", () => {
    const first = loadSectionTemplate("PAUSE", "CHILD", "BEGINNER");
    const section = first["4"]?.[0];
    if (!section) {
      throw new Error("Missing section");
    }
    section.numOfWeeks = 99;

    expect(loadSectionTemplate("PAUSE", "CHILD", "BEGINNER")["4"]?.[0]).toEqual(
      { type: "SWR1", numOfWeeks: 2, cardioType: "CARDIO_4" },
    );
  });
});

describe("parseSectionTemplate", () => {
  it("accepts a real pause template", () => {
    expect(
      parseSectionTemplate("pause", PauseTemplates.adult.beginner),
    ).toEqual(PauseTemplates.adult.beginner);
  });

  it("rejects a template with an unknown section type", () => {
    const fixture = {
      "1": [{ type: "NOPE", numOfWeeks: 1, cardioType: "CARDIO_4" }],
    };
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parseSectionTemplate("fixture", fixture)).toThrow(
      "Invalid data structure for section template fixture",
    );
    consoleError.mockRestore();
  });
});
