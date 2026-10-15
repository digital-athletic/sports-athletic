import * as v from "valibot";
import DirectionsData from "../../assets/data/generator/directions.json";
import { loadExercises } from "./loadExercises";
import { loadDirections, parseDirections } from "./loadDirections";
import { DirectionsByRegionSchema } from "@/schemas/generator.schema";

const validDirections = {
  CORE: { "1": [{ direction: "SIDE", side: "BOTH" }] },
  FULL_BODY: { "1": [{ direction: null, side: "BOTH" }] },
  LOWER_BODY: { "1": [{ direction: "KNEE", side: "BOTH" }] },
  LOWER_BODY_GKS: { "1": [{ direction: "KNEE", side: "BOTH" }] },
  UPPER_BODY: { "1": [{ direction: "HORIZONTAL_PUSH", side: "BOTH" }] },
};

const catalogDirections = () =>
  new Set(
    JSON.stringify(loadExercises()).match(/EXERCISE_DIRECTION_[A-Z_]+/g) ?? [],
  );

describe("loadDirections: real file", () => {
  it("returns a known value", () => {
    expect(loadDirections().LOWER_BODY_GKS["2"]).toEqual([
      { direction: "KNEE", side: "BOTH" },
      { direction: "HIP", side: "BOTH" },
    ]);
  });

  it("returns a fresh deep copy on every call", () => {
    const first = loadDirections();
    first.CORE["1"].splice(0, 1);

    expect(loadDirections().CORE["1"]).toEqual([
      { direction: "SIDE", side: "BOTH" },
    ]);
  });

  it("uses only directions that exist as exercise direction tags", () => {
    const tags = catalogDirections();

    Object.values(loadDirections())
      .flatMap((map) => Object.values(map).flat())
      .forEach(({ direction }) => {
        if (direction !== null) {
          expect(tags).toContain(`EXERCISE_DIRECTION_${direction}`);
        }
      });
  });
});

describe("parseDirections: invalid data", () => {
  it("throws an error naming the data set", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parseDirections({})).toThrow("Directions");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("returns a clone of the source with the source key order", () => {
    const parsed = parseDirections(DirectionsData);

    expect(parsed).toEqual(DirectionsData);
    expect(parsed).not.toBe(DirectionsData);
    expect(Object.keys(parsed)).toEqual(Object.keys(DirectionsData));
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

  it("rejects an unknown direction", () => {
    const invalid = structuredClone(validDirections);
    invalid.CORE["1"] = [{ direction: "SIDEWAYS", side: "BOTH" }];

    expect(v.safeParse(DirectionsByRegionSchema, invalid).success).toBe(false);
  });

  it("rejects a non numeric count key", () => {
    const invalid = structuredClone(validDirections);
    Object.assign(invalid.CORE, { two: [{ direction: "SIDE", side: "BOTH" }] });

    expect(v.safeParse(DirectionsByRegionSchema, invalid).success).toBe(false);
  });
});
