import * as v from "valibot";
import { loadMaxMinutes } from "./loadMaxMinutes";
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

describe("loadMaxMinutes", () => {
  it("parses the real file", () => {
    const maxMinutes = loadMaxMinutes();

    expect(Object.keys(maxMinutes).sort()).toEqual(
      Object.keys(validMaxMinutes).sort(),
    );
    expect(maxMinutes.SWR).toEqual({
      BEGINNER: 35,
      ADVANCED: 45,
      PROFESSIONAL: 60,
    });
  });
});

describe("MaxMinutesSchema", () => {
  it("accepts all groups with all three levels", () => {
    expect(v.safeParse(MaxMinutesSchema, validMaxMinutes).success).toBe(true);
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
});
