import { getRegionsForPreventionSkills } from "./preventionUtils";

describe("preventionUtils", () => {
  describe("getRegionsForPreventionSkills", () => {
    it("returns ankle regions for PREVANKLE", () => {
      const result = getRegionsForPreventionSkills(["PREVANKLE"]);
      expect(result).toEqual(["SPRUNGGELENK"]);
    });

    it("returns knee and hip regions for PREVKNEE", () => {
      const result = getRegionsForPreventionSkills(["PREVKNEE"]);
      expect(result).toEqual(["KNIE", "HUEFTE", "KNIE_HUEFTE"]);
    });

    it("returns shoulder region for PREVSHOULDER", () => {
      const result = getRegionsForPreventionSkills(["PREVSHOULDER"]);
      expect(result).toEqual(["SCHULTER"]);
    });

    it("returns spine regions for PREVSPINE", () => {
      const result = getRegionsForPreventionSkills(["PREVSPINE"]);
      expect(result).toEqual(["WIRBELSAEULE", "WIRBELSAULE"]);
    });

    it("returns wrist and elbow regions for PREVWRIST", () => {
      const result = getRegionsForPreventionSkills(["PREVWRIST"]);
      expect(result).toEqual([
        "HANDGELENK",
        "ELLBOGEN",
        "HANDGELENK_ELLENBOGEN",
      ]);
    });

    it("returns multiple regions for multiple prevention skills", () => {
      const result = getRegionsForPreventionSkills([
        "PREVANKLE",
        "PREVSHOULDER",
      ]);
      expect(result).toEqual(["SPRUNGGELENK", "SCHULTER"]);
    });

    it("returns empty array for empty input", () => {
      const result = getRegionsForPreventionSkills([]);
      expect(result).toEqual([]);
    });

    it("ignores unknown prevention skills", () => {
      const result = getRegionsForPreventionSkills(["UNKNOWN", "PREVKNEE"]);
      expect(result).toEqual(["KNIE", "HUEFTE", "KNIE_HUEFTE"]);
    });

    it("handles all prevention skills at once", () => {
      const result = getRegionsForPreventionSkills([
        "PREVANKLE",
        "PREVKNEE",
        "PREVSHOULDER",
        "PREVSPINE",
        "PREVWRIST",
      ]);
      expect(result).toContain("SPRUNGGELENK");
      expect(result).toContain("KNIE");
      expect(result).toContain("SCHULTER");
      expect(result).toContain("WIRBELSAEULE");
      expect(result).toContain("HANDGELENK");
    });
  });
});
