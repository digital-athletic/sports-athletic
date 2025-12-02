import { getAreasFor, getOpposingExerciseDirection } from "./exerciseUtils";

describe("exerciseUtils", () => {
  describe("getOpposingExerciseDirection", () => {
    it("returns opposing vertical directions", () => {
      expect(getOpposingExerciseDirection("VERTICAL_PUSH")).toBe(
        "VERTICAL_PULL",
      );
      expect(getOpposingExerciseDirection("VERTICAL_PULL")).toBe(
        "VERTICAL_PUSH",
      );
    });

    it("returns opposing horizontal directions", () => {
      expect(getOpposingExerciseDirection("HORIZONTAL_PUSH")).toBe(
        "HORIZONTAL_PULL",
      );
      expect(getOpposingExerciseDirection("HORIZONTAL_PULL")).toBe(
        "HORIZONTAL_PUSH",
      );
    });

    it("returns opposing hip/knee directions", () => {
      expect(getOpposingExerciseDirection("HIP")).toBe("KNEE");
      expect(getOpposingExerciseDirection("KNEE")).toBe("HIP");
    });

    it("returns empty string for unknown direction", () => {
      expect(getOpposingExerciseDirection("UNKNOWN")).toBe("");
      expect(getOpposingExerciseDirection("")).toBe("");
    });
  });

  describe("getAreasFor", () => {
    it("returns oberkoerper for upper body muscles", () => {
      const result = getAreasFor(["BRUST", "SCHULTER"]);
      expect(result).toContain("oberkoerper");
      expect(result).not.toContain("unterkoerper");
      expect(result).not.toContain("core");
    });

    it("returns unterkoerper for lower body muscles", () => {
      const result = getAreasFor([
        "OBERSCHENKELVORDERSEITE",
        "WADE",
        "GESAESS",
      ]);
      expect(result).toContain("unterkoerper");
      expect(result).not.toContain("oberkoerper");
      expect(result).not.toContain("core");
    });

    it("returns core for core muscles", () => {
      const result = getAreasFor(["GERADE_BAUCHMUSKELN", "UNTERER_RUECKEN"]);
      expect(result).toContain("core");
      expect(result).not.toContain("oberkoerper");
      expect(result).not.toContain("unterkoerper");
    });

    it("returns multiple areas for muscles from different regions", () => {
      const result = getAreasFor(["BRUST", "GERADE_BAUCHMUSKELN", "GESAESS"]);
      expect(result).toContain("oberkoerper");
      expect(result).toContain("core");
      expect(result).toContain("unterkoerper");
      expect(result).toHaveLength(3);
    });

    it("returns empty array for unknown muscles", () => {
      const result = getAreasFor(["UNKNOWN_MUSCLE", "ANOTHER_UNKNOWN"]);
      expect(result).toEqual([]);
    });

    it("returns empty array for empty input", () => {
      const result = getAreasFor([]);
      expect(result).toEqual([]);
    });

    it("handles sided muscles correctly", () => {
      const result = getAreasFor(["SCHULTER_RECHTS", "SCHULTER_LINKS"]);
      expect(result).toContain("oberkoerper");
      expect(result).toHaveLength(1);
    });
  });
});
