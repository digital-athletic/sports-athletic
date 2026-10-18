import PlacesData from "../../assets/data/generator/places.json";
import { loadPlaces, parsePlaces } from "./loadPlaces";

describe("loadPlaces: real file", () => {
  it("returns the four places in source order", () => {
    expect(Object.keys(loadPlaces())).toEqual([
      "HOME",
      "STUDIO",
      "HALL",
      "OUTSIDE",
    ]);
  });

  it("returns a known value", () => {
    expect(loadPlaces().HOME.EQUIPMENT).toEqual([
      "BOTTLE",
      "CHAIR",
      "SLIPPERY_GROUND",
      "TOWEL",
      "WALL",
    ]);
  });

  it("returns a fresh deep copy on every call", () => {
    loadPlaces().HOME.EQUIPMENT.splice(0, 1);

    expect(loadPlaces().HOME.EQUIPMENT[0]).toBe("BOTTLE");
  });

  it("lists no equipment twice within a place", () => {
    Object.values(loadPlaces()).forEach(({ EQUIPMENT }) => {
      expect(new Set(EQUIPMENT).size).toBe(EQUIPMENT.length);
    });
  });
});

describe("parsePlaces: invalid data", () => {
  it("throws an error naming the data set", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parsePlaces({})).toThrow("Places");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("rejects a place without equipment", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parsePlaces({ ...PlacesData, HOME: {} })).toThrow("Places");
    consoleError.mockRestore();
  });

  it("returns a clone of the source", () => {
    const parsed = parsePlaces(PlacesData);

    expect(parsed).toEqual(PlacesData);
    expect(parsed).not.toBe(PlacesData);
  });
});
