import { getBlocksFromPains, getPreventionsFromPains } from "./painUtils";

describe("painUtils", () => {
  describe("getPreventionsFromPains", () => {
    it("should map shoulder pain to shoulder prevention", () => {
      const result = getPreventionsFromPains(["SCHULTER_LINKS"]);
      expect(result).toContain("PREVSHOULDER");
    });

    it("should map both shoulders to single prevention entry", () => {
      const result = getPreventionsFromPains([
        "SCHULTER_LINKS",
        "SCHULTER_RECHTS",
      ]);
      expect(result).toEqual(["PREVSHOULDER"]);
    });

    it("should map elbow pain to wrist prevention", () => {
      const result = getPreventionsFromPains(["ELLBOGEN_LINKS"]);
      expect(result).toContain("PREVWRIST");
    });

    it("should map wrist pain to wrist prevention", () => {
      const result = getPreventionsFromPains(["HANDGELENK_RECHTS"]);
      expect(result).toContain("PREVWRIST");
    });

    it("should map elbow and wrist to single wrist prevention", () => {
      const result = getPreventionsFromPains([
        "ELLBOGEN_LINKS",
        "HANDGELENK_RECHTS",
      ]);
      expect(result).toEqual(["PREVWRIST"]);
    });

    it("should map spine pain to spine prevention", () => {
      const result = getPreventionsFromPains(["WIRBELSAEULE"]);
      expect(result).toContain("PREVSPINE");
    });

    it("should map hip and knee pain to knee prevention", () => {
      const result = getPreventionsFromPains(["HUEFTE_LINKS", "KNIE_RECHTS"]);
      expect(result).toEqual(["PREVKNEE"]);
    });

    it("should map ankle pain to ankle prevention", () => {
      const result = getPreventionsFromPains(["SPRUNGGELENK_LINKS"]);
      expect(result).toContain("PREVANKLE");
    });

    it("should handle multiple prevention types", () => {
      const result = getPreventionsFromPains([
        "SCHULTER_LINKS",
        "WIRBELSAEULE",
        "SPRUNGGELENK_RECHTS",
      ]);
      expect(result).toContain("PREVSHOULDER");
      expect(result).toContain("PREVSPINE");
      expect(result).toContain("PREVANKLE");
      expect(result.length).toBe(3);
    });

    it("should avoid duplicates", () => {
      const result = getPreventionsFromPains([
        "SCHULTER_LINKS",
        "SCHULTER_RECHTS",
        "SCHULTER_LINKS",
      ]);
      expect(result).toEqual(["PREVSHOULDER"]);
    });

    it("should return empty array for empty input", () => {
      const result = getPreventionsFromPains([]);
      expect(result).toEqual([]);
    });

    it("should handle unknown pain location with shoulder default", () => {
      const result = getPreventionsFromPains(["UNKNOWN_PAIN"]);
      expect(result).toEqual(["PREVSHOULDER"]);
    });

    it("should handle mixed known and unknown pain locations", () => {
      const result = getPreventionsFromPains([
        "SCHULTER_LINKS",
        "UNKNOWN_PAIN",
      ]);
      expect(result).toEqual(["PREVSHOULDER"]);
    });
  });

  describe("getBlocksFromPains", () => {
    it("should map shoulder pain to shoulder block", () => {
      const result = getBlocksFromPains(["SCHULTER_LINKS"]);
      expect(result).toContain("SCHULTER");
    });

    it("should map both shoulders to single block entry", () => {
      const result = getBlocksFromPains(["SCHULTER_LINKS", "SCHULTER_RECHTS"]);
      expect(result).toEqual(["SCHULTER"]);
    });

    it("should map elbow pain to elbow block", () => {
      const result = getBlocksFromPains(["ELLBOGEN_RECHTS"]);
      expect(result).toContain("ELLENBOGEN");
    });

    it("should map wrist pain to wrist block", () => {
      const result = getBlocksFromPains(["HANDGELENK_LINKS"]);
      expect(result).toContain("HANDGELENK");
    });

    it("should map spine pain to spine block", () => {
      const result = getBlocksFromPains(["WIRBELSAEULE"]);
      expect(result).toEqual(["WIRBELSAEULE"]);
    });

    it("should map hip pain to hip block", () => {
      const result = getBlocksFromPains(["HUEFTE_LINKS"]);
      expect(result).toContain("HUEFTE");
    });

    it("should map knee pain to knee block", () => {
      const result = getBlocksFromPains(["KNIE_RECHTS"]);
      expect(result).toContain("KNIE");
    });

    it("should map ankle pain to ankle block", () => {
      const result = getBlocksFromPains(["SPRUNGGELENK_LINKS"]);
      expect(result).toContain("SPRUNGGELENK");
    });

    it("should handle multiple block types", () => {
      const result = getBlocksFromPains([
        "SCHULTER_LINKS",
        "WIRBELSAEULE",
        "SPRUNGGELENK_RECHTS",
      ]);
      expect(result).toContain("SCHULTER");
      expect(result).toContain("WIRBELSAEULE");
      expect(result).toContain("SPRUNGGELENK");
      expect(result.length).toBe(3);
    });

    it("should avoid duplicates", () => {
      const result = getBlocksFromPains([
        "SCHULTER_LINKS",
        "SCHULTER_RECHTS",
        "SCHULTER_LINKS",
      ]);
      expect(result).toEqual(["SCHULTER"]);
    });

    it("should return empty array for empty input", () => {
      const result = getBlocksFromPains([]);
      expect(result).toEqual([]);
    });

    it("should handle unknown pain location with shoulder default", () => {
      const result = getBlocksFromPains(["UNKNOWN_PAIN"]);
      expect(result).toEqual(["SCHULTER"]);
    });

    it("should handle mixed known and unknown pain locations", () => {
      const result = getBlocksFromPains(["SCHULTER_LINKS", "UNKNOWN_PAIN"]);
      expect(result).toEqual(["SCHULTER"]);
    });

    it("should map all body parts correctly", () => {
      const allPains = [
        "SCHULTER_LINKS",
        "ELLBOGEN_LINKS",
        "HANDGELENK_LINKS",
        "WIRBELSAEULE",
        "HUEFTE_LINKS",
        "KNIE_LINKS",
        "SPRUNGGELENK_LINKS",
      ];
      const result = getBlocksFromPains(allPains);
      expect(result).toEqual([
        "SCHULTER",
        "ELLENBOGEN",
        "HANDGELENK",
        "WIRBELSAEULE",
        "HUEFTE",
        "KNIE",
        "SPRUNGGELENK",
      ]);
    });
  });
});
