import { generateCatalogWithProgression } from "../../../../test/factories/skillCatalog";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import {
  isSkillWithoutProgression,
  readSkillCatalogEntry,
} from "./skillCatalogEntry";

describe("skillCatalogEntry: readSkillCatalogEntry", () => {
  it("reads an entry of the given catalog", () => {
    expect(readSkillCatalogEntry(loadSkillCatalog(), "GKS")?.intensity).toBe(
      "GKS",
    );
  });

  it.each(["UNKNOWN", "constructor", "toString"])(
    "reads no entry for %s",
    (skill) => {
      expect(readSkillCatalogEntry(loadSkillCatalog(), skill)).toBeUndefined();
    },
  );
});

describe("skillCatalogEntry: isSkillWithoutProgression", () => {
  it.each([
    ["WUSKSA", true],
    ["WUSPEZIAL", true],
    ["TEST", true],
    ["WU", true],
    ["MOB", true],
    ["CD", true],
    ["BR", true],
    ["SWR2", false],
    ["GKS", false],
    ["MAX_STRENGTH", false],
    ["UNKNOWN", false],
  ])("reads %s as without progression: %p", (skill, expected) => {
    expect(isSkillWithoutProgression(loadSkillCatalog(), skill)).toBe(expected);
  });

  it("reads the progression flag of the given catalog", () => {
    expect(
      isSkillWithoutProgression(
        generateCatalogWithProgression("WU", true),
        "WU",
      ),
    ).toBe(false);
    expect(
      isSkillWithoutProgression(
        generateCatalogWithProgression("GKS", false),
        "GKS",
      ),
    ).toBe(true);
  });
});
