import { renderHook, act } from "@testing-library/react-native";
import NetInfo from "@react-native-community/netinfo";
import { useNetworkState } from "./useNetworkState";

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe("useNetworkState", () => {
  let capturedListener:
    | ((state: {
        isConnected: boolean | null;
        isInternetReachable: boolean | null;
      }) => void)
    | null = null;
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    capturedListener = null;
    mockUnsubscribe.mockClear();
    mockNetInfo.addEventListener.mockImplementation((listener) => {
      capturedListener = listener as typeof capturedListener;
      return mockUnsubscribe;
    });
    // Default fetch: unresolved promise so tests control state via listener
    mockNetInfo.fetch.mockReturnValue(new Promise(() => {}) as never);
  });

  it("returns true by default (optimistic initial state)", () => {
    const { result } = renderHook(() => useNetworkState());
    expect(result.current).toBe(true);
  });

  it("returns false when NetInfo reports isConnected=false", async () => {
    const { result } = renderHook(() => useNetworkState());

    await act(async () => {
      capturedListener?.({ isConnected: false, isInternetReachable: false });
    });

    expect(result.current).toBe(false);
  });

  it("returns true when NetInfo reports isConnected=true and isInternetReachable=true", async () => {
    const { result } = renderHook(() => useNetworkState());

    await act(async () => {
      capturedListener?.({ isConnected: true, isInternetReachable: true });
    });

    expect(result.current).toBe(true);
  });

  it("returns true when isInternetReachable=null (null treated as reachable)", async () => {
    const { result } = renderHook(() => useNetworkState());

    await act(async () => {
      capturedListener?.({ isConnected: true, isInternetReachable: null });
    });

    expect(result.current).toBe(true);
  });

  it("calls unsubscribe on unmount", () => {
    const { unmount } = renderHook(() => useNetworkState());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
