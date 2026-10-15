import * as v from "valibot";
import MaxMinutesData from "../../assets/data/generator/maxMinutes.json";
import { loadMaxMinutes, parseMaxMinutes } from "./loadMaxMinutes";
import { MaxMinutesSchema } from "@/schemas/generator.schema";

const levels = { BEGINNER: 10, ADVANCED: 10, PROFESSIONAL: 10 };

const validMaxMinutes = {
  BAS: levels,
  CARDIO: levels,
  DEFAULT: levels,
  GKS: levels,
  MAX: levels,
  PREV: levels,
  SA: levels,
  SK: levels,
  SWR: levels,
  WUSPEZIAL: levels,
};

describe("loadMaxMinutes: real file", () => {
  it("returns a known value", () => {
    expect(loadMaxMinutes().SWR.PROFESSIONAL).toBe(60);
  });

  it("returns the same frozen value on every call", () => {
    const first = loadMaxMinutes();

    expect(loadMaxMinutes()).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.SWR)).toBe(true);
  });

  it.each(Object.entries(MaxMinutesData))(
    "%s: minutes are non negative integers that do not fall with the level",
    (_group, { BEGINNER, ADVANCED, PROFESSIONAL }) => {
      for (const minutes of [BEGINNER, ADVANCED, PROFESSIONAL]) {
        expect(Number.isInteger(minutes)).toBe(true);
        expect(minutes).toBeGreaterThanOrEqual(0);
      }
      expect(BEGINNER).toBeLessThanOrEqual(ADVANCED);
      expect(ADVANCED).toBeLessThanOrEqual(PROFESSIONAL);
    },
  );
});

describe("parseMaxMinutes: invalid data", () => {
  it("throws an error naming the data set", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parseMaxMinutes({})).toThrow("MaxMinutes");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("MaxMinutesSchema", () => {
  it("accepts all groups with all three levels", () => {
    expect(v.safeParse(MaxMinutesSchema, validMaxMinutes).success).toBe(true);
  });

  it("accepts zero minutes", () => {
    const zero = { ...validMaxMinutes, MAX: { ...levels, BEGINNER: 0 } };

    expect(v.safeParse(MaxMinutesSchema, zero).success).toBe(true);
  });

  it("rejects a missing fitness level", () => {
    const invalid = {
      ...validMaxMinutes,
      GKS: { BEGINNER: 25, ADVANCED: 30 },
    };

    expect(v.safeParse(MaxMinutesSchema, invalid).success).toBe(false);
  });

  it("rejects a missing skill group", () => {
    const invalid = { ...validMaxMinutes, SWR: undefined };

    expect(v.safeParse(MaxMinutesSchema, invalid).success).toBe(false);
  });

  it("rejects a non numeric value", () => {
    const invalid = { ...validMaxMinutes, SA: { ...levels, BEGINNER: "30" } };

    expect(v.safeParse(MaxMinutesSchema, invalid).success).toBe(false);
  });

  it("rejects a negative value", () => {
    const invalid = { ...validMaxMinutes, SA: { ...levels, BEGINNER: -5 } };

    expect(v.safeParse(MaxMinutesSchema, invalid).success).toBe(false);
  });

  it("rejects a fractional value", () => {
    const invalid = { ...validMaxMinutes, SA: { ...levels, BEGINNER: 2.5 } };

    expect(v.safeParse(MaxMinutesSchema, invalid).success).toBe(false);
  });
});
