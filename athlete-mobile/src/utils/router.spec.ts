import { parseBooleanParam, parseIntParam } from "./router";

describe("router utils", () => {
  describe("parseIntParam", () => {
    it("parses valid positive integer strings", () => {
      expect(parseIntParam("42")).toBe(42);
      expect(parseIntParam("0")).toBe(0);
      expect(parseIntParam("999999")).toBe(999999);
    });

    it("parses negative integer strings", () => {
      expect(parseIntParam("-15")).toBe(-15);
      expect(parseIntParam("-1")).toBe(-1);
    });

    it("handles whitespace by parsing leading digits", () => {
      expect(parseIntParam("  123  ")).toBe(123);
    });

    it("truncates decimal strings to integer", () => {
      expect(parseIntParam("3.14")).toBe(3);
      expect(parseIntParam("9.99")).toBe(9);
    });

    it("parses strings with leading numbers", () => {
      expect(parseIntParam("123abc")).toBe(123);
    });

    it("returns undefined for non-numeric strings", () => {
      expect(parseIntParam("abc")).toBeUndefined();
      expect(parseIntParam("")).toBeUndefined();
      expect(parseIntParam("hello123")).toBeUndefined();
    });
  });

  describe("parseBooleanParam", () => {
    it("returns true for 'true' in any case", () => {
      expect(parseBooleanParam("true")).toBeTruthy();
      expect(parseBooleanParam("TRUE")).toBeTruthy();
      expect(parseBooleanParam("True")).toBeTruthy();
      expect(parseBooleanParam("tRuE")).toBeTruthy();
    });

    it("returns false for any other string value", () => {
      expect(parseBooleanParam("false")).toBeFalsy();
      expect(parseBooleanParam("0")).toBeFalsy();
      expect(parseBooleanParam("1")).toBeFalsy();
      expect(parseBooleanParam("")).toBeFalsy();
      expect(parseBooleanParam("  hello  ")).toBeFalsy();
    });

    it("returns true for 'true' with whitespace", () => {
      expect(parseBooleanParam("  true  ")).toBeTruthy();
      expect(parseBooleanParam(" true")).toBeTruthy();
    });
  });
});
