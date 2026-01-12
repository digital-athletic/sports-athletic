import { getTimeString, getWeightString } from "./formatters";

describe("formatters", () => {
  describe("getTimeString", () => {
    it("formats seconds only when under 60", () => {
      expect(getTimeString(45)).toBe("45 s");
    });

    it("formats minutes and seconds", () => {
      expect(getTimeString(125)).toBe("2 min 5 s");
    });

    it("formats minutes only when no remaining seconds", () => {
      expect(getTimeString(120)).toBe("2 min");
    });

    it("formats hours and minutes for long durations", () => {
      expect(getTimeString(3725)).toBe("1 h 2 min");
    });

    it("formats zero duration", () => {
      expect(getTimeString(0)).toBe("0 s");
    });
  });

  describe("getWeightString", () => {
    it("formats weight with kg unit", () => {
      expect(getWeightString(100)).toBe("100 kg");
    });

    it("rounds decimal weights", () => {
      expect(getWeightString(100.6)).toBe("101 kg");
      expect(getWeightString(100.4)).toBe("100 kg");
    });

    it("converts to tons for weights >= 1000kg", () => {
      expect(getWeightString(1000)).toBe("1.00 t");
      expect(getWeightString(1500)).toBe("1.50 t");
      expect(getWeightString(2345)).toBe("2.35 t");
    });

    it("formats zero weight", () => {
      expect(getWeightString(0)).toBe("0 kg");
    });
  });
});
