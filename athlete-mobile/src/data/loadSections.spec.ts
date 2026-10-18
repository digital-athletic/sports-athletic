import * as v from "valibot";
import SectionsJson from "../../assets/data/sections.json";
import { loadSections, parseSections } from "./loadSections";
import { SectionsFileSchema } from "@/schemas/sections.schema";

describe("loadSections: real file", () => {
  it("returns a known value", () => {
    const { SECTIONS_DATA, SECTIONS_VIDEOS } = loadSections();

    expect(SECTIONS_DATA.SK.speed.values.default).toEqual([
      "1-2 Sek.",
      "2 Sek.",
      "explosiv",
    ]);
    expect(SECTIONS_VIDEOS.MAX.title).toBe("INFO_FOR_MAX_FORCE");
  });

  it("keeps the umlauts of the German texts", () => {
    const { SWR, SA, SK } = loadSections().SECTIONS_DATA;

    expect(SWR.target.default.highlight[0]).toBe("Erhöhung der Belastbarkeit");
    expect(SA.target.default.highlight[3]).toBe("Würfen.");
    expect(SK.target.default.normal[0]).toContain("Kraftausstoßes");
  });

  it("returns the same frozen value on every call", () => {
    const first = loadSections();

    expect(loadSections()).toBe(first);
    expect(Object.isFrozen(first.SECTIONS_DATA.SWR.target.default.normal)).toBe(
      true,
    );
  });

  // The screen renders highlight after each normal part, so normal has the same length or one more.
  it("keeps the normal and highlight parts of every target text in step", () => {
    Object.values(loadSections().SECTIONS_DATA)
      .flatMap((section) => Object.values(section.target))
      .forEach(({ normal, highlight }) => {
        const difference = normal.length - highlight.length;

        expect([0, 1]).toContain(difference);
      });
  });

  it("has a default text for every speed entry", () => {
    Object.values(loadSections().SECTIONS_DATA).forEach(({ speed }) => {
      expect(speed.values.default.length).toBeGreaterThan(0);
      expect(typeof speed.description.default).toBe("string");
    });
  });
});

describe("parseSections: invalid data", () => {
  it("throws an error naming the data set", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parseSections({})).toThrow("Sections");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("returns a clone of the source", () => {
    const parsed = parseSections(SectionsJson);

    expect(parsed).toEqual(SectionsJson);
    expect(parsed).not.toBe(SectionsJson);
  });
});

describe("SectionsFileSchema", () => {
  it("accepts the real file", () => {
    expect(v.safeParse(SectionsFileSchema, SectionsJson).success).toBe(true);
  });

  it("rejects a missing section prefix", () => {
    const rest = Object.fromEntries(
      Object.entries(SectionsJson.SECTIONS_DATA).filter(
        ([key]) => key !== "SK",
      ),
    );

    expect(
      v.safeParse(SectionsFileSchema, { ...SectionsJson, SECTIONS_DATA: rest })
        .success,
    ).toBe(false);
  });

  it("rejects a target without the default text", () => {
    const invalid = structuredClone(SectionsJson);
    Object.assign(invalid.SECTIONS_DATA.SWR.target, { default: undefined });

    expect(v.safeParse(SectionsFileSchema, invalid).success).toBe(false);
  });

  it("rejects a video entry without a title", () => {
    const invalid = structuredClone(SectionsJson);
    Object.assign(invalid.SECTIONS_VIDEOS.SA, { title: 1 });

    expect(v.safeParse(SectionsFileSchema, invalid).success).toBe(false);
  });
});
