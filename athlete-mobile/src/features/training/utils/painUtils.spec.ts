import {
  getBlocksFromPains,
  getPreventionsFromPains,
  isPainRegion,
  isSamePainSet,
  PAIN_REGIONS,
  shouldShowPainAlert,
} from "./painUtils";

describe("painUtils: pain region vocabulary", () => {
  it("accepts every offered region", () => {
    const rejected = PAIN_REGIONS.filter((region) => !isPainRegion(region));
    expect(rejected).toEqual([]);
  });

  it("rejects muscle values and side neutral joint names", () => {
    expect(isPainRegion("GLUTES")).toBe(false);
    expect(isPainRegion("KNEE")).toBe(false);
  });
});

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

    it("should ignore unknown pain locations", () => {
      const result = getPreventionsFromPains(["UNKNOWN_PAIN", "GLUTES"]);
      expect(result).toEqual([]);
    });

    it("should keep known pain locations next to unknown ones", () => {
      const result = getPreventionsFromPains(["KNEE_LEFT", "UNKNOWN_PAIN"]);
      expect(result).toEqual(["PREVKNEE"]);
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

    it("should ignore unknown pain locations", () => {
      const result = getBlocksFromPains(["UNKNOWN_PAIN", "GLUTES"]);
      expect(result).toEqual([]);
    });

    it("should keep known pain locations next to unknown ones", () => {
      const result = getBlocksFromPains(["KNEE_LEFT", "UNKNOWN_PAIN"]);
      expect(result).toEqual(["KNEE"]);
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

describe("painUtils: shouldShowPainAlert", () => {
  const pains = { PAIN: ["KNEE_LEFT"] };
  const withMax = [
    { weightType: "weightAbsolute" },
    { weightType: "weightFMax" },
  ];
  const withoutMax = [{ weightType: "weightAbsolute" }, {}];

  it("stays silent without pain tags, even for the strength test", () => {
    expect(shouldShowPainAlert("TEST_WORKOUT", [], {})).toBe(false);
    expect(shouldShowPainAlert("PLAN", withMax, undefined)).toBe(false);
  });

  it("fires for the strength test with pain tags", () => {
    expect(shouldShowPainAlert("TEST_WORKOUT", [], pains)).toBe(true);
  });

  it("fires for a plan training that contains a max strength exercise", () => {
    expect(shouldShowPainAlert("PLAN", withMax, pains)).toBe(true);
  });

  it("stays silent for a plan training without max strength exercises", () => {
    expect(shouldShowPainAlert("PLAN", withoutMax, pains)).toBe(false);
  });

  it("stays silent for focus and prevention trainings", () => {
    expect(shouldShowPainAlert("BAS", withMax, pains)).toBe(false);
    expect(shouldShowPainAlert("PREVKNEE", withMax, pains)).toBe(false);
  });
});

describe("painUtils: isSamePainSet", () => {
  it("treats the same pains in another order as equal", () => {
    expect(isSamePainSet(["SPINE", "KNEE_LEFT"], ["KNEE_LEFT", "SPINE"])).toBe(
      true,
    );
  });

  it("treats two empty pain lists as equal", () => {
    expect(isSamePainSet([], [])).toBe(true);
  });

  it("detects an added pain", () => {
    expect(isSamePainSet(["KNEE_LEFT"], ["KNEE_LEFT", "SPINE"])).toBe(false);
  });

  it("detects a removed pain", () => {
    expect(isSamePainSet(["KNEE_LEFT", "SPINE"], ["KNEE_LEFT"])).toBe(false);
  });

  it("detects a replaced pain", () => {
    expect(isSamePainSet(["KNEE_LEFT"], ["SPINE"])).toBe(false);
  });
});
