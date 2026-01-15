import {
  convertAnamnesisTagsToWorkoutTags,
  getTagValue,
  getTagValues,
} from "./tagUtils";

describe("tagUtils", () => {
  describe("getTagValues", () => {
    it("extracts values for a given tag group", () => {
      const tags = ["LEVEL_ADVANCED", "POSITION_FIELD", "PAIN_KNEE"];
      expect(getTagValues(tags, "LEVEL")).toEqual(["ADVANCED"]);
    });

    it("returns empty array for non-existent tag group", () => {
      const tags = ["LEVEL_BEGINNER"];
      expect(getTagValues(tags, "PAIN")).toEqual([]);
    });
  });

  describe("getTagValue", () => {
    it("returns first value for tag group", () => {
      const tags = ["LEVEL_PROFESSIONAL", "POSITION_GOAL"];
      expect(getTagValue(tags, "LEVEL")).toBe("PROFESSIONAL");
    });
  });

  describe("convertAnamnesisTagsToWorkoutTags", () => {
    it("converts single tag group", () => {
      const anamnesisTags = { LEVEL: ["ADVANCED"] };
      expect(convertAnamnesisTagsToWorkoutTags(anamnesisTags)).toEqual([
        "LEVEL_ADVANCED",
      ]);
    });

    it("converts multiple tag groups with multiple values", () => {
      const anamnesisTags = {
        LEVEL: ["BEGINNER"],
        POSITION: ["FIELD"],
        PAIN: ["KNEE", "ANKLE"],
      };
      const result = convertAnamnesisTagsToWorkoutTags(anamnesisTags);
      expect(result).toContain("LEVEL_BEGINNER");
      expect(result).toContain("PAIN_KNEE");
    });

    it("returns empty array for empty input", () => {
      expect(convertAnamnesisTagsToWorkoutTags({})).toEqual([]);
    });
  });
});
