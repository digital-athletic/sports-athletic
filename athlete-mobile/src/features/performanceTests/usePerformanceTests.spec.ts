import { type SportTest } from "@/features/performanceTests/models/SportTest";
import { useSportTestsStore } from "@/store/sportTestsStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { generateSportTest } from "./testFixtures";
import { usePerformanceTests } from "./usePerformanceTests";

const mockFetchSportTests = jest.fn();
jest.mock("@/services/SportTestService", () => ({
  fetchSportTests: (sport: string) => mockFetchSportTests(sport),
}));

// Runs the focus callback on mount like a first focus.
jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => {
    require("react").useEffect(callback, [callback]);
  },
}));

beforeEach(() => {
  mockFetchSportTests.mockReset();
  useSportTestsStore.setState({ testsBySport: {} });
  useUserWorkoutStore.getState().setSport("HANDBALL_SPORT");
});

describe("usePerformanceTests: without cache", () => {
  it("starts loading and then returns the loaded tests", async () => {
    const tests = [generateSportTest("FAKE_TEST_A")];
    let answerRequest: (tests: SportTest[]) => void = () => undefined;
    mockFetchSportTests.mockReturnValue(
      new Promise<SportTest[]>((resolve) => {
        answerRequest = resolve;
      }),
    );

    const { result } = await renderHook(() => usePerformanceTests());

    expect(result.current.state).toEqual({ status: "loading" });
    await act(async () => {
      answerRequest(tests);
    });
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "loaded", tests }),
    );
    expect(mockFetchSportTests).toHaveBeenCalledWith("HANDBALL_SPORT");
  });

  it("returns error when the load fails", async () => {
    mockFetchSportTests.mockRejectedValue(new Error("offline"));

    const { result } = await renderHook(() => usePerformanceTests());

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "error" }),
    );
  });

  it("loads again on reload after an error", async () => {
    const tests = [generateSportTest("FAKE_TEST_A")];
    mockFetchSportTests.mockRejectedValueOnce(new Error("offline"));
    mockFetchSportTests.mockResolvedValueOnce(tests);
    const { result } = await renderHook(() => usePerformanceTests());
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "error" }),
    );

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "loaded", tests }),
    );
  });
});

describe("usePerformanceTests: with cache", () => {
  it("shows the cached list at once while the refresh is pending", async () => {
    const cached = [generateSportTest("FAKE_TEST_CACHED")];
    useSportTestsStore.setState({ testsBySport: { HANDBALL_SPORT: cached } });
    mockFetchSportTests.mockReturnValue(new Promise(() => {}));

    const { result } = await renderHook(() => usePerformanceTests());

    expect(result.current.state).toEqual({ status: "loaded", tests: cached });
  });

  it("still returns the cached list when the refresh fails", async () => {
    const cached = [generateSportTest("FAKE_TEST_CACHED")];
    useSportTestsStore.setState({ testsBySport: { HANDBALL_SPORT: cached } });
    mockFetchSportTests.mockRejectedValue(new Error("offline"));

    const { result } = await renderHook(() => usePerformanceTests());
    await waitFor(() => expect(mockFetchSportTests).toHaveBeenCalledTimes(1));
    await act(async () => {});

    expect(result.current.state).toEqual({ status: "loaded", tests: cached });
  });

  it("replaces the cache with the refreshed list", async () => {
    const cached = [generateSportTest("FAKE_TEST_CACHED")];
    const refreshed = [generateSportTest("FAKE_TEST_REFRESHED")];
    useSportTestsStore.setState({ testsBySport: { HANDBALL_SPORT: cached } });
    mockFetchSportTests.mockResolvedValue(refreshed);

    const { result } = await renderHook(() => usePerformanceTests());

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "loaded",
        tests: refreshed,
      }),
    );
    expect(useSportTestsStore.getState().testsBySport.HANDBALL_SPORT).toEqual(
      refreshed,
    );
  });
});
