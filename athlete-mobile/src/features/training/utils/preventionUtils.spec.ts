import { getRegionsForPreventionSkills } from "./preventionUtils";

describe("preventionUtils", () => {
  describe("getRegionsForPreventionSkills", () => {
    it("returns ankle regions for PREVANKLE", () => {
      const result = getRegionsForPreventionSkills(["PREVANKLE"]);
      expect(result).toEqual(["ANKLE"]);
    });

    it("returns knee and hip regions for PREVKNEE", () => {
      const result = getRegionsForPreventionSkills(["PREVKNEE"]);
      expect(result).toEqual(["KNEE", "HIP", "KNEE_HIP"]);
    });

    it("returns shoulder region for PREVSHOULDER", () => {
      const result = getRegionsForPreventionSkills(["PREVSHOULDER"]);
      expect(result).toEqual(["SHOULDER"]);
    });

    it("returns spine regions for PREVSPINE", () => {
      const result = getRegionsForPreventionSkills(["PREVSPINE"]);
      expect(result).toEqual(["SPINE"]);
    });

    it("returns wrist and elbow regions for PREVWRIST", () => {
      const result = getRegionsForPreventionSkills(["PREVWRIST"]);
      expect(result).toEqual(["WRIST", "ELBOW", "WRIST_ELBOW"]);
    });

    it("returns multiple regions for multiple prevention skills", () => {
      const result = getRegionsForPreventionSkills([
        "PREVANKLE",
        "PREVSHOULDER",
      ]);
      expect(result).toEqual(["ANKLE", "SHOULDER"]);
    });

    it("returns empty array for empty input", () => {
      const result = getRegionsForPreventionSkills([]);
      expect(result).toEqual([]);
    });

    it("ignores unknown prevention skills", () => {
      const result = getRegionsForPreventionSkills(["UNKNOWN", "PREVKNEE"]);
      expect(result).toEqual(["KNEE", "HIP", "KNEE_HIP"]);
    });

    it("handles all prevention skills at once", () => {
      const result = getRegionsForPreventionSkills([
        "PREVANKLE",
        "PREVKNEE",
        "PREVSHOULDER",
        "PREVSPINE",
        "PREVWRIST",
      ]);
      expect(result).toContain("ANKLE");
      expect(result).toContain("KNEE");
      expect(result).toContain("SHOULDER");
      expect(result).toContain("SPINE");
      expect(result).toContain("WRIST");
    });
  });
});
