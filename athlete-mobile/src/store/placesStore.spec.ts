import { act, renderHook } from "@testing-library/react-native";
import { usePlacesStore } from "./placesStore";

describe("placesStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => usePlacesStore());
    act(() => {
      result.current.resetPlaces();
    });
  });

  describe("initial state", () => {
    it("has all four places defined", () => {
      const { result } = renderHook(() => usePlacesStore());
      expect(Object.keys(result.current.places)).toEqual([
        "HOME",
        "STUDIO",
        "HALL",
        "OUTSIDE",
      ]);
    });

    it("HOME has default equipment", () => {
      const { result } = renderHook(() => usePlacesStore());
      expect(result.current.places.HOME.equipment.length).toBeGreaterThan(0);
    });

    it("STUDIO has correct default equipment", () => {
      const { result } = renderHook(() => usePlacesStore());
      expect(result.current.places.STUDIO.equipment).toEqual([
        "ADJUSTABLE_BENCH",
        "BARBELL",
        "BARBELL_BENCH",
        "BARBELL_MULTIPLE",
        "BENCH",
        "BOX_HIGH",
        "BOX_LOW",
        "CROSS_BAR",
        "DUMBBELL",
        "FOAM_BALL",
        "FOAM_ROLLER",
        "MEDICINE_BALL",
        "MEDICINE_BALL_JUMPING",
        "POWER_RACK",
        "TREADMILL",
        "WALL",
      ]);
    });

    it("HOME has correct default equipment", () => {
      const { result } = renderHook(() => usePlacesStore());
      expect(result.current.places.HOME.equipment).toEqual([
        "BOTTLE",
        "CHAIR",
        "SLIPPERY_GROUND",
        "TOWEL",
        "WALL",
      ]);
    });

    it("HALL has correct default equipment", () => {
      const { result } = renderHook(() => usePlacesStore());
      expect(result.current.places.HALL.equipment).toEqual([
        "AREA_10",
        "AREA_20",
        "AREA_5",
        "BOX_HIGH",
        "BOX_LOW",
        "CEILING",
        "EXERCISING_BENCH",
        "FOAM_BALL",
        "FOAM_ROLLER",
        "HANDBALL",
        "HANDBALL_GOAL",
        "MARKERS",
        "MEDICINE_BALL",
        "MEDICINE_BALL_JUMPING",
        "MULTIPLE_EXERCISING_BENCHES",
        "SLIPPERY_GROUND",
        "SPEED_LADDER",
        "TOWEL",
        "TRACK_20",
        "TRACK_5",
        "WALL",
        "WALL_BAR",
      ]);
    });

    it("OUTSIDE has correct default equipment", () => {
      const { result } = renderHook(() => usePlacesStore());
      expect(result.current.places.OUTSIDE.equipment).toEqual([
        "AREA_10",
        "AREA_20",
        "AREA_5",
        "CEILING",
        "PARK_BENCH",
        "TRACK_20",
        "TRACK_5",
        "TRACK_LONG",
      ]);
    });
  });

  describe("setPlaceEquipment", () => {
    it("replaces equipment for a place", () => {
      const { result } = renderHook(() => usePlacesStore());

      act(() => {
        result.current.setPlaceEquipment("HOME", ["DUMBBELL", "BENCH"]);
      });

      expect(result.current.places.HOME.equipment).toEqual([
        "DUMBBELL",
        "BENCH",
      ]);
    });
  });

  describe("toggleEquipment", () => {
    it("adds equipment if not present", () => {
      const { result } = renderHook(() => usePlacesStore());

      act(() => {
        result.current.setPlaceEquipment("HOME", []);
        result.current.toggleEquipment("HOME", "BARBELL");
      });

      expect(result.current.places.HOME.equipment).toContain("BARBELL");
    });

    it("removes equipment if present", () => {
      const { result } = renderHook(() => usePlacesStore());

      act(() => {
        result.current.setPlaceEquipment("HOME", ["BARBELL"]);
        result.current.toggleEquipment("HOME", "BARBELL");
      });

      expect(result.current.places.HOME.equipment).not.toContain("BARBELL");
    });
  });

  describe("getPlaceEquipment", () => {
    it("returns equipment for specified place", () => {
      const { result } = renderHook(() => usePlacesStore());

      act(() => {
        result.current.setPlaceEquipment("STUDIO", ["TREADMILL"]);
      });

      expect(result.current.getPlaceEquipment("STUDIO")).toEqual(["TREADMILL"]);
    });
  });
});
