import { TagGroups } from "@/constants/tagGroups";
import {
  getTagValue,
  getTagValues,
  getUserTagValue,
  getUserTagValues,
  isTagInGroup,
  TAG_GROUP_SUBGROUPS,
} from "./tagUtils";

describe("tagUtils", () => {
  describe("TAG_GROUP_SUBGROUPS", () => {
    it("defines EQ sub-groups", () => {
      expect(TAG_GROUP_SUBGROUPS[TagGroups.EQUIPMENT]).toContain(
        TagGroups.EQ_TYPE,
      );
    });

    it("defines MUSCLE sub-groups", () => {
      expect(TAG_GROUP_SUBGROUPS[TagGroups.MUSCLE]).toContain(
        TagGroups.MUSCLE_SECONDARY,
      );
      expect(TAG_GROUP_SUBGROUPS[TagGroups.MUSCLE]).toContain(
        TagGroups.MUSCLE_INVOLVEMENT,
      );
    });
  });

  describe("isTagInGroup", () => {
    it("returns true for tag in parent group", () => {
      expect(isTagInGroup("EQ_DUMBBELL", "EQ")).toBe(true);
      expect(isTagInGroup("MUSCLE_CHEST", "MUSCLE")).toBe(true);
    });

    it("returns false for tag in sub-group", () => {
      expect(isTagInGroup("EQ_TYPE_WEIGHTS", "EQ")).toBe(false);
      expect(isTagInGroup("EQ_TYPE_KG", "EQ")).toBe(false);
      expect(isTagInGroup("MUSCLE_SECONDARY_BACK", "MUSCLE")).toBe(false);
      expect(isTagInGroup("MUSCLE_INVOLVEMENT_ISOLATED", "MUSCLE")).toBe(false);
    });

    it("returns false for tag not matching prefix", () => {
      expect(isTagInGroup("LEVEL_ADVANCED", "EQ")).toBe(false);
      expect(isTagInGroup("PAIN_KNEE", "MUSCLE")).toBe(false);
    });

    it("returns true for sub-group when queried directly", () => {
      expect(isTagInGroup("EQ_TYPE_WEIGHTS", "EQ_TYPE")).toBe(true);
      expect(isTagInGroup("MUSCLE_SECONDARY_BACK", "MUSCLE_SECONDARY")).toBe(
        true,
      );
      expect(
        isTagInGroup("MUSCLE_INVOLVEMENT_ISOLATED", "MUSCLE_INVOLVEMENT"),
      ).toBe(true);
    });
  });

  describe("getTagValues (for flat exercise/branch tags)", () => {
    it("extracts values for a given tag group", () => {
      const tags = ["LEVEL_ADVANCED", "POSITION_FIELD", "PAIN_KNEE"];
      expect(getTagValues(tags, "LEVEL")).toEqual(["ADVANCED"]);
    });

    it("returns empty array for non-existent tag group", () => {
      const tags = ["LEVEL_BEGINNER"];
      expect(getTagValues(tags, "PAIN")).toEqual([]);
    });

    it("excludes EQ_TYPE tags when querying EQ", () => {
      const tags = [
        "EQ_DUMBBELL",
        "EQ_TYPE_WEIGHTS",
        "EQ_BARBELL",
        "EQ_TYPE_KG",
      ];
      expect(getTagValues(tags, "EQ")).toEqual(["DUMBBELL", "BARBELL"]);
    });

    it("excludes MUSCLE_SECONDARY and MUSCLE_INVOLVEMENT when querying MUSCLE", () => {
      const tags = [
        "MUSCLE_CHEST",
        "MUSCLE_SECONDARY_BACK",
        "MUSCLE_TRICEPS",
        "MUSCLE_INVOLVEMENT_ISOLATED",
      ];
      expect(getTagValues(tags, "MUSCLE")).toEqual(["CHEST", "TRICEPS"]);
    });

    it("allows direct query of sub-groups", () => {
      const tags = ["EQ_DUMBBELL", "EQ_TYPE_WEIGHTS", "EQ_TYPE_KG"];
      expect(getTagValues(tags, "EQ_TYPE")).toEqual(["WEIGHTS", "KG"]);
    });

    it("allows direct query of MUSCLE_SECONDARY", () => {
      const tags = [
        "MUSCLE_CHEST",
        "MUSCLE_SECONDARY_BACK",
        "MUSCLE_SECONDARY_GLUTES",
      ];
      expect(getTagValues(tags, "MUSCLE_SECONDARY")).toEqual([
        "BACK",
        "GLUTES",
      ]);
    });
  });

  describe("getTagValue (for flat exercise/branch tags)", () => {
    it("returns first value for tag group", () => {
      const tags = ["LEVEL_PROFESSIONAL", "POSITION_GOAL"];
      expect(getTagValue(tags, "LEVEL")).toBe("PROFESSIONAL");
    });
  });

  describe("getUserTagValues (for structured user tags)", () => {
    it("extracts values for a given tag group", () => {
      const tags = { LEVEL: ["ADVANCED"], POSITION: ["FIELD"], PAIN: ["KNEE"] };
      expect(getUserTagValues(tags, "LEVEL")).toEqual(["ADVANCED"]);
    });

    it("returns multiple values for tag group", () => {
      const tags = { PAIN: ["KNEE", "ANKLE", "BACK"] };
      expect(getUserTagValues(tags, "PAIN")).toEqual(["KNEE", "ANKLE", "BACK"]);
    });

    it("returns empty array for non-existent tag group", () => {
      const tags = { LEVEL: ["BEGINNER"] };
      expect(getUserTagValues(tags, "PAIN")).toEqual([]);
    });

    it("returns empty array for undefined tags", () => {
      expect(getUserTagValues(undefined, "LEVEL")).toEqual([]);
    });
  });

  describe("getUserTagValue (for structured user tags)", () => {
    it("returns first value for tag group", () => {
      const tags = { LEVEL: ["PROFESSIONAL"], POSITION: ["GOAL"] };
      expect(getUserTagValue(tags, "LEVEL")).toBe("PROFESSIONAL");
    });

    it("returns undefined for non-existent tag group", () => {
      const tags = { LEVEL: ["BEGINNER"] };
      expect(getUserTagValue(tags, "PAIN")).toBeUndefined();
    });

    it("returns undefined for undefined tags", () => {
      expect(getUserTagValue(undefined, "LEVEL")).toBeUndefined();
    });
  });
});
