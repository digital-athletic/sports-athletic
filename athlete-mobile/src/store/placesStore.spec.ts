import { act, renderHook } from "@testing-library/react-native";
import { usePlacesStore } from "./placesStore";

describe("placesStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => usePlacesStore());
    act(() => {
      result.current.clearPlaces();
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
