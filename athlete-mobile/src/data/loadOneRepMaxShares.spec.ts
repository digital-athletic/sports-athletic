import * as v from "valibot";
import {
  loadOneRepMaxShares,
  parseOneRepMaxShares,
} from "./loadOneRepMaxShares";
import { OneRepMaxSharesSchema } from "@/schemas/oneRepMaxShares.schema";
import { generateOneRepMaxShares } from "@test/factories/testSets";

describe("loadOneRepMaxShares: real file", () => {
  it("parses the 1RM shares of the bundled data", () => {
    expect(loadOneRepMaxShares()).toEqual({
      beginner: 0.75,
      advanced: 0.8,
      professional: 0.85,
    });
  });

  it("returns the same frozen value on every call", () => {
    expect(loadOneRepMaxShares()).toBe(loadOneRepMaxShares());
  });
});

describe("parseOneRepMaxShares: invalid data", () => {
  it("throws an error naming the data set", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parseOneRepMaxShares({})).toThrow("OneRepMaxShares");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("OneRepMaxSharesSchema", () => {
  it("accepts a share of exactly 1", () => {
    const valid = generateOneRepMaxShares({ professional: 1 });

    expect(v.safeParse(OneRepMaxSharesSchema, valid).success).toBe(true);
  });

  it("rejects a missing level", () => {
    const invalid = { beginner: 0.75, advanced: 0.8 };

    expect(v.safeParse(OneRepMaxSharesSchema, invalid).success).toBe(false);
  });

  it("rejects a share above 1", () => {
    const invalid = generateOneRepMaxShares({ professional: 1.01 });

    expect(v.safeParse(OneRepMaxSharesSchema, invalid).success).toBe(false);
  });

  it("rejects a share of 0", () => {
    const invalid = generateOneRepMaxShares({ beginner: 0 });

    expect(v.safeParse(OneRepMaxSharesSchema, invalid).success).toBe(false);
  });

  it("rejects an unknown level", () => {
    const invalid = { ...generateOneRepMaxShares(), elite: 0.9 };

    expect(v.safeParse(OneRepMaxSharesSchema, invalid).success).toBe(false);
  });
});
