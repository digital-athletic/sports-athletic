import {
  getTagValue,
  getTagValues,
  getUserTagValue,
  getUserTagValues,
} from "./tagUtils";

describe("tagUtils", () => {
  describe("getTagValues (for flat exercise/branch tags)", () => {
    it("extracts values for a given tag group", () => {
      const tags = ["LEVEL_ADVANCED", "POSITION_FIELD", "PAIN_KNEE"];
      expect(getTagValues(tags, "LEVEL")).toEqual(["ADVANCED"]);
    });

    it("returns empty array for non-existent tag group", () => {
      const tags = ["LEVEL_BEGINNER"];
      expect(getTagValues(tags, "PAIN")).toEqual([]);
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
