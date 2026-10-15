import * as v from "valibot";
import {
  loadSectionTemplate,
  parseSectionTemplate,
} from "./loadSectionTemplates";
import PauseTemplates from "../../assets/data/generator/trainingSections/pause.json";
import { TrainingSectionsMapSchema } from "@/schemas/generator.schema";

const AGE_GROUPS = ["child", "adult"] as const;
const LEVELS = ["beginner", "advanced", "professional"] as const;

const SEASON_PHASES = ["pause", "preparatory", "competition"] as const;

// Real data exceptions, kept visible here until the data is corrected.
const KNOWN_WEEK_MISMATCHES: Record<(typeof SEASON_PHASES)[number], string[]> =
  {
    pause: [],
    preparatory: [],
    competition: ["competition/adult/beginner key 18 sums to 17"],
  };

const validTemplate = (): Record<string, unknown> => {
  const template: Record<string, unknown> = {};
  for (let week = 1; week <= 20; week++) {
    template[String(week)] = [
      { type: "SWR1", numOfWeeks: week, cardioType: "CARDIO_4" },
    ];
  }
  return template;
};

const expectRejected = (fixture: unknown): void => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  expect(() => parseSectionTemplate("fixture", fixture)).toThrow(
    "Invalid data structure for section template fixture",
  );
  consoleError.mockRestore();
};

describe("loadSectionTemplate: real data", () => {
  it.each(SEASON_PHASES)(
    "every week total of %s matches its key",
    (seasonPhase) => {
      const mismatches: string[] = [];
      for (const ageGroup of AGE_GROUPS) {
        for (const level of LEVELS) {
          const template = loadSectionTemplate(seasonPhase, ageGroup, level);
          for (const [key, sections] of Object.entries(template)) {
            if (key === "repeat") {
              continue;
            }
            const total = (sections ?? []).reduce(
              (sum, section) => sum + section.numOfWeeks,
              0,
            );
            if (total !== Number(key)) {
              mismatches.push(
                `${seasonPhase}/${ageGroup}/${level} key ${key} sums to ${total}`,
              );
            }
          }
        }
      }

      expect(mismatches).toEqual(KNOWN_WEEK_MISMATCHES[seasonPhase]);
    },
  );
});

describe("parseSectionTemplate: schema rules", () => {
  it("accepts a template with all keys 1 to 20 and a repeat block", () => {
    const fixture = {
      ...validTemplate(),
      repeat: [{ type: "SWR1", numOfWeeks: 4, cardioType: "CARDIO_4" }],
    };

    expect(parseSectionTemplate("fixture", fixture)).toEqual(fixture);
  });

  it("rejects a template that misses a week key", () => {
    const fixture = validTemplate();
    delete fixture["7"];

    expectRejected(fixture);
  });

  it("rejects a week key above 20", () => {
    expectRejected({ ...validTemplate(), "21": [] });
  });

  it("rejects a key that is neither a week nor repeat", () => {
    expectRejected({ ...validTemplate(), extra: [] });
  });

  it("rejects a key with a leading zero", () => {
    expectRejected({ ...validTemplate(), "05": [] });
  });

  it.each([0, -1, 1.5])("rejects numOfWeeks %s", (numOfWeeks) => {
    expectRejected({
      ...validTemplate(),
      "1": [{ type: "SWR1", numOfWeeks, cardioType: "CARDIO_4" }],
    });
  });
});

describe("loadSectionTemplate: pause file", () => {
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
    const originalLength = first["4"]?.length;
    section.numOfWeeks = 99;
    first["4"]?.push(section);

    const second = loadSectionTemplate("PAUSE", "CHILD", "BEGINNER");
    expect(second["4"]?.[0]).toEqual({
      type: "SWR1",
      numOfWeeks: 2,
      cardioType: "CARDIO_4",
    });
    expect(second["4"]).toHaveLength(originalLength ?? -1);
  });
});

describe("parseSectionTemplate: real pause file and throw path", () => {
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
