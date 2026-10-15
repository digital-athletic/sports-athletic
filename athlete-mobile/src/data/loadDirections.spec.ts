import * as v from "valibot";
import { loadDirections } from "./loadDirections";
import { DirectionsByRegionSchema } from "@/schemas/generator.schema";

const validDirections = {
  CORE: { "1": [{ direction: "SIDE", side: "BOTH" }] },
  FULL_BODY: { "1": [{ direction: null, side: "BOTH" }] },
  LOWER_BODY: { "1": [{ direction: "KNEE", side: "BOTH" }] },
  LOWER_BODY_GKS: { "1": [{ direction: "KNEE", side: "BOTH" }] },
  UPPER_BODY: { "1": [{ direction: "HORIZONTAL_PUSH", side: "BOTH" }] },
};

describe("loadDirections", () => {
  it("parses the real file", () => {
    const directions = loadDirections();

    expect(directions.LOWER_BODY_GKS["2"]).toEqual([
      { direction: "KNEE", side: "BOTH" },
      { direction: "HIP", side: "BOTH" },
    ]);
    expect(Object.keys(directions.CORE)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
    ]);
  });

  it("returns a fresh copy on every call", () => {
    const first = loadDirections();
    first.CORE["1"].splice(0, 1);

    expect(loadDirections().CORE["1"]).toEqual([
      { direction: "SIDE", side: "BOTH" },
    ]);
  });
});

describe("DirectionsByRegionSchema", () => {
  it("accepts a valid file", () => {
    expect(v.safeParse(DirectionsByRegionSchema, validDirections).success).toBe(
      true,
    );
  });

  it("rejects exercise_direction", () => {
    const invalid = structuredClone(validDirections);
    const renamed: unknown[] = [{ exercise_direction: "KNEE", side: "BOTH" }];
    Object.assign(invalid.LOWER_BODY_GKS, { "1": renamed });

    expect(v.safeParse(DirectionsByRegionSchema, invalid).success).toBe(false);
  });

  it("rejects an unknown side", () => {
    const invalid = structuredClone(validDirections);
    invalid.CORE["1"] = [{ direction: "SIDE", side: "LEFT" }];

    expect(v.safeParse(DirectionsByRegionSchema, invalid).success).toBe(false);
  });
});
