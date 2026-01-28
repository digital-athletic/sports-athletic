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
    it("returns upper_body for upper body muscles", () => {
      const result = getAreasFor(["CHEST", "SHOULDER"]);
      expect(result).toContain("upper_body");
      expect(result).not.toContain("lower_body");
      expect(result).not.toContain("core");
    });

    it("returns lower_body for lower body muscles", () => {
      const result = getAreasFor(["QUADRICEPS", "CALF", "GLUTES"]);
      expect(result).toContain("lower_body");
      expect(result).not.toContain("upper_body");
      expect(result).not.toContain("core");
    });

    it("returns core for core muscles", () => {
      const result = getAreasFor(["RECTUS_ABDOMINIS", "LOWER_BACK"]);
      expect(result).toContain("core");
      expect(result).not.toContain("upper_body");
      expect(result).not.toContain("lower_body");
    });

    it("returns multiple areas for muscles from different regions", () => {
      const result = getAreasFor(["CHEST", "RECTUS_ABDOMINIS", "GLUTES"]);
      expect(result).toContain("upper_body");
      expect(result).toContain("core");
      expect(result).toContain("lower_body");
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
      const result = getAreasFor(["SHOULDER_RIGHT", "SHOULDER_LEFT"]);
      expect(result).toContain("upper_body");
      expect(result).toHaveLength(1);
    });
  });
});
