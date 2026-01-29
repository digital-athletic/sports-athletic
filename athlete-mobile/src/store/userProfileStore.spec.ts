import { act, renderHook } from "@testing-library/react-native";
import { useUserProfileStore } from "./userProfileStore";

describe("userProfileStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUserProfileStore());
    act(() => {
      result.current.clearProfile();
    });
  });

  describe("initial state", () => {
    it("has default personal data", () => {
      const { result } = renderHook(() => useUserProfileStore());

      expect(result.current.personalData.username).toBe("");
      expect(result.current.personalData.gender).toBe("MALE");
    });

    it("has no userId initially", () => {
      const { result } = renderHook(() => useUserProfileStore());

      expect(result.current.userId).toBeNull();
    });

    it("has anamnesisCompleted false initially", () => {
      const { result } = renderHook(() => useUserProfileStore());

      expect(result.current.anamnesisCompleted).toBe(false);
    });

    it("has undefined height and weight initially", () => {
      const { result } = renderHook(() => useUserProfileStore());

      expect(result.current.personalData.height).toBeUndefined();
      expect(result.current.personalData.weight).toBeUndefined();
    });
  });

  describe("setHeight", () => {
    it("sets height in personalData", () => {
      const { result } = renderHook(() => useUserProfileStore());

      act(() => {
        result.current.setHeight(180);
      });

      expect(result.current.personalData.height).toBe(180);
    });

    it("does not affect other personalData fields", () => {
      const { result } = renderHook(() => useUserProfileStore());

      act(() => {
        result.current.setUsername("TestUser");
        result.current.setHeight(185);
      });

      expect(result.current.personalData.username).toBe("TestUser");
      expect(result.current.personalData.height).toBe(185);
      expect(result.current.personalData.gender).toBe("MALE");
    });
  });

  describe("setWeight", () => {
    it("sets weight in personalData", () => {
      const { result } = renderHook(() => useUserProfileStore());

      act(() => {
        result.current.setWeight(75);
      });

      expect(result.current.personalData.weight).toBe(75);
    });

    it("does not affect other personalData fields", () => {
      const { result } = renderHook(() => useUserProfileStore());

      act(() => {
        result.current.setGender("FEMALE");
        result.current.setWeight(60);
      });

      expect(result.current.personalData.gender).toBe("FEMALE");
      expect(result.current.personalData.weight).toBe(60);
      expect(result.current.personalData.username).toBe("");
    });
  });

  describe("setPersonalData", () => {
    it("merges height and weight with existing data", () => {
      const { result } = renderHook(() => useUserProfileStore());

      act(() => {
        result.current.setPersonalData({
          height: 175,
          weight: 70,
        });
      });

      expect(result.current.personalData.height).toBe(175);
      expect(result.current.personalData.weight).toBe(70);
      expect(result.current.personalData.gender).toBe("MALE");
    });
  });

  describe("clearProfile", () => {
    it("resets height and weight to undefined", () => {
      const { result } = renderHook(() => useUserProfileStore());

      act(() => {
        result.current.setHeight(180);
        result.current.setWeight(80);
        result.current.clearProfile();
      });

      expect(result.current.personalData.height).toBeUndefined();
      expect(result.current.personalData.weight).toBeUndefined();
    });
  });

  describe("getAge", () => {
    it("calculates age from birthday", () => {
      const { result } = renderHook(() => useUserProfileStore());
      const today = new Date();
      const birthYear = today.getFullYear() - 25;
      const birthMonth = String(today.getMonth() + 1).padStart(2, "0");
      const birthDay = String(today.getDate()).padStart(2, "0");

      act(() => {
        // ISO 8601 format: YYYY-MM-DD
        result.current.setBirthday(`${birthYear}-${birthMonth}-${birthDay}`);
      });

      expect(result.current.getAge()).toBe(25);
    });
  });
});
