import { getBlocksFromPains, getPreventionsFromPains } from "./painUtils";

describe("painUtils", () => {
  describe("getPreventionsFromPains", () => {
    it("should map shoulder pain to shoulder prevention", () => {
      const result = getPreventionsFromPains(["SHOULDER_LEFT"]);
      expect(result).toContain("PREVSHOULDER");
    });

    it("should map both shoulders to single prevention entry", () => {
      const result = getPreventionsFromPains([
        "SHOULDER_LEFT",
        "SHOULDER_RIGHT",
      ]);
      expect(result).toEqual(["PREVSHOULDER"]);
    });

    it("should map elbow pain to wrist prevention", () => {
      const result = getPreventionsFromPains(["ELBOW_LEFT"]);
      expect(result).toContain("PREVWRIST");
    });

    it("should map wrist pain to wrist prevention", () => {
      const result = getPreventionsFromPains(["WRIST_RIGHT"]);
      expect(result).toContain("PREVWRIST");
    });

    it("should map elbow and wrist to single wrist prevention", () => {
      const result = getPreventionsFromPains(["ELBOW_LEFT", "WRIST_RIGHT"]);
      expect(result).toEqual(["PREVWRIST"]);
    });

    it("should map spine pain to spine prevention", () => {
      const result = getPreventionsFromPains(["SPINE"]);
      expect(result).toContain("PREVSPINE");
    });

    it("should map hip and knee pain to knee prevention", () => {
      const result = getPreventionsFromPains(["HIP_LEFT", "KNEE_RIGHT"]);
      expect(result).toEqual(["PREVKNEE"]);
    });

    it("should map ankle pain to ankle prevention", () => {
      const result = getPreventionsFromPains(["ANKLE_LEFT"]);
      expect(result).toContain("PREVANKLE");
    });

    it("should handle multiple prevention types", () => {
      const result = getPreventionsFromPains([
        "SHOULDER_LEFT",
        "SPINE",
        "ANKLE_RIGHT",
      ]);
      expect(result).toContain("PREVSHOULDER");
      expect(result).toContain("PREVSPINE");
      expect(result).toContain("PREVANKLE");
      expect(result.length).toBe(3);
    });

    it("should avoid duplicates", () => {
      const result = getPreventionsFromPains([
        "SHOULDER_LEFT",
        "SHOULDER_RIGHT",
        "SHOULDER_LEFT",
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
      const result = getPreventionsFromPains(["SHOULDER_LEFT", "UNKNOWN_PAIN"]);
      expect(result).toEqual(["PREVSHOULDER"]);
    });
  });

  describe("getBlocksFromPains", () => {
    it("should map shoulder pain to shoulder block", () => {
      const result = getBlocksFromPains(["SHOULDER_LEFT"]);
      expect(result).toContain("SHOULDER");
    });

    it("should map both shoulders to single block entry", () => {
      const result = getBlocksFromPains(["SHOULDER_LEFT", "SHOULDER_RIGHT"]);
      expect(result).toEqual(["SHOULDER"]);
    });

    it("should map elbow pain to elbow block", () => {
      const result = getBlocksFromPains(["ELBOW_RIGHT"]);
      expect(result).toContain("ELBOW");
    });

    it("should map wrist pain to wrist block", () => {
      const result = getBlocksFromPains(["WRIST_LEFT"]);
      expect(result).toContain("WRIST");
    });

    it("should map spine pain to spine block", () => {
      const result = getBlocksFromPains(["SPINE"]);
      expect(result).toEqual(["SPINE"]);
    });

    it("should map hip pain to hip block", () => {
      const result = getBlocksFromPains(["HIP_LEFT"]);
      expect(result).toContain("HIP");
    });

    it("should map knee pain to knee block", () => {
      const result = getBlocksFromPains(["KNEE_RIGHT"]);
      expect(result).toContain("KNEE");
    });

    it("should map ankle pain to ankle block", () => {
      const result = getBlocksFromPains(["ANKLE_LEFT"]);
      expect(result).toContain("ANKLE");
    });

    it("should handle multiple block types", () => {
      const result = getBlocksFromPains([
        "SHOULDER_LEFT",
        "SPINE",
        "ANKLE_RIGHT",
      ]);
      expect(result).toContain("SHOULDER");
      expect(result).toContain("SPINE");
      expect(result).toContain("ANKLE");
      expect(result.length).toBe(3);
    });

    it("should avoid duplicates", () => {
      const result = getBlocksFromPains([
        "SHOULDER_LEFT",
        "SHOULDER_RIGHT",
        "SHOULDER_LEFT",
      ]);
      expect(result).toEqual(["SHOULDER"]);
    });

    it("should return empty array for empty input", () => {
      const result = getBlocksFromPains([]);
      expect(result).toEqual([]);
    });

    it("should handle unknown pain location with shoulder default", () => {
      const result = getBlocksFromPains(["UNKNOWN_PAIN"]);
      expect(result).toEqual(["SHOULDER"]);
    });

    it("should handle mixed known and unknown pain locations", () => {
      const result = getBlocksFromPains(["SHOULDER_LEFT", "UNKNOWN_PAIN"]);
      expect(result).toEqual(["SHOULDER"]);
    });

    it("should map all body parts correctly", () => {
      const allPains = [
        "SHOULDER_LEFT",
        "ELBOW_LEFT",
        "WRIST_LEFT",
        "SPINE",
        "HIP_LEFT",
        "KNEE_LEFT",
        "ANKLE_LEFT",
      ];
      const result = getBlocksFromPains(allPains);
      expect(result).toEqual([
        "SHOULDER",
        "ELBOW",
        "WRIST",
        "SPINE",
        "HIP",
        "KNEE",
        "ANKLE",
      ]);
    });
  });
});
