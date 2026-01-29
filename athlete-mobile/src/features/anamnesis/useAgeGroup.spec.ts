import { WorkoutConstants } from "@/constants/workoutConstants";
import { DEFAULT_STATE, useUserProfileStore } from "@/store/userProfileStore";
import { renderHook } from "@testing-library/react-native";
import { useAgeGroup } from "./useAgeGroup";

describe("useAgeGroup", () => {
  const REFERENCE_DATE = new Date("2026-01-01");

  beforeEach(() => {
    // Reset store state before each test
    useUserProfileStore.setState(DEFAULT_STATE);
    // Use fake timers to control "today's date" for consistent tests
    jest.useFakeTimers();
    jest.setSystemTime(REFERENCE_DATE);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("default behavior", () => {
    it("returns CHILD for deafult store state", () => {
      useUserProfileStore.setState(DEFAULT_STATE);

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.CHILD);
    });

    it("returns ADULT if birthday is falsy", () => {
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.ADULT);
    });
  });

  describe("CHILD age group (age < 16)", () => {
    it("returns CHILD for a 10-year-old", () => {
      // Born 2016-01-01 (exactly 10 years ago)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "2016-01-01",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.CHILD);
    });

    it("returns CHILD for a 15-year-old", () => {
      // Born 2011-01-01 (exactly 15 years ago)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "2011-01-01",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.CHILD);
    });

    it("returns CHILD for someone who is on the day before their 16th birthday", () => {
      // Born 2010-01-02 (1 day before 16th birthday)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "2010-01-02",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.CHILD);
    });
  });

  describe("ADOLESCENT age group (age 16-18)", () => {
    it("returns ADOLESCENT for a 16-year-old", () => {
      // Born 2010-01-01 (exactly 16 years ago)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "2010-01-01",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.ADOLESCENT);
    });

    it("returns ADOLESCENT for a 17-year-old", () => {
      // Born 2009-01-01 (exactly 17 years ago)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "2009-01-01",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.ADOLESCENT);
    });

    it("returns ADOLESCENT for someone who just turned 16", () => {
      // Born 2009-12-30 (16 years and 2 days ago)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "2009-12-30",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.ADOLESCENT);
    });
  });

  describe("ADULT age group (age > 18)", () => {
    it("returns ADULT for an 18-year-old", () => {
      // Born 2008-01-01 (exactly 18 years ago)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "2008-01-01",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.ADULT);
    });

    it("returns ADULT for a 25-year-old", () => {
      // Born 2001-01-01 (exactly 25 years ago)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "2001-01-01",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.ADULT);
    });

    it("returns ADULT for a 50-year-old", () => {
      // Born 1976-01-01 (exactly 50 years ago)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "1976-01-01",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.ADULT);
    });
  });

  describe("edge cases at boundaries", () => {
    it("returns CHILD for someone 1 day before their 16th birthday", () => {
      // Born 2010-01-02 (still 15 years old)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "2010-01-02",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.CHILD);
    });

    it("returns ADOLESCENT for someone 1 day before their 18th birthday", () => {
      // Born 2008-01-02 (still 17 years old)
      useUserProfileStore.setState({
        personalData: {
          ...DEFAULT_STATE.personalData,
          birthday: "2008-01-02",
        },
      });

      const { result } = renderHook(() => useAgeGroup());

      expect(result.current).toBe(WorkoutConstants.AGE_GROUPS.ADOLESCENT);
    });
  });
});
