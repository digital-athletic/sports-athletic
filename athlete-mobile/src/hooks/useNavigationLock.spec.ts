import { act, renderHook } from "@testing-library/react-native";
import { useNavigationLock } from "./useNavigationLock";

// Holds the latest focus effect, so a test decides when the screen regains focus.
let mockFocusEffect: (() => void | (() => void)) | undefined;
jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    mockFocusEffect = effect;
  },
}));

beforeEach(() => {
  mockFocusEffect = undefined;
});

describe("useNavigationLock: runLocked", () => {
  it("runs the action on the first call", async () => {
    const action = jest.fn();
    const { result } = await renderHook(() => useNavigationLock());

    await act(() => {
      result.current.runLocked(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("ignores further calls while locked", async () => {
    const action = jest.fn();
    const { result } = await renderHook(() => useNavigationLock());

    await act(() => {
      result.current.runLocked(action);
      result.current.runLocked(action);
      result.current.runLocked(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("runs the next action after release", async () => {
    const action = jest.fn();
    const { result } = await renderHook(() => useNavigationLock());

    await act(() => {
      result.current.runLocked(action);
      result.current.release();
      result.current.runLocked(action);
    });

    expect(action).toHaveBeenCalledTimes(2);
  });

  it("runs the next action after the screen regains focus", async () => {
    const action = jest.fn();
    const { result } = await renderHook(() => useNavigationLock());

    await act(() => {
      result.current.runLocked(action);
    });
    await act(() => {
      mockFocusEffect?.();
    });
    await act(() => {
      result.current.runLocked(action);
    });

    expect(action).toHaveBeenCalledTimes(2);
  });
});
