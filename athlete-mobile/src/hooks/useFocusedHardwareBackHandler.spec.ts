import { renderHook } from "@testing-library/react-native";
import { BackHandler, Platform } from "react-native";
import { useFocusedHardwareBackHandler } from "./useFocusedHardwareBackHandler";

// The screen is focused while the hook is mounted; unmounting stands in for blur.
jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    useFocusEffect: (effect: () => void | (() => void)) => {
      useEffect(effect, [effect]);
    },
  };
});

const mockAddEventListener = jest
  .spyOn(BackHandler, "addEventListener")
  .mockReturnValue({ remove: jest.fn() });

describe("useFocusedHardwareBackHandler", () => {
  beforeEach(() => {
    mockAddEventListener.mockClear();
    Platform.OS = "android";
  });

  it("registers the handler for hardwareBackPress while focused", async () => {
    const handler = jest.fn().mockReturnValue(true);

    await renderHook(() => useFocusedHardwareBackHandler(handler));

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "hardwareBackPress",
      expect.any(Function),
    );
  });

  it("runs the handler and reports the press as handled", async () => {
    const handler = jest.fn().mockReturnValue(true);
    await renderHook(() => useFocusedHardwareBackHandler(handler));

    const registered = mockAddEventListener.mock.calls[0]?.[1];

    expect(registered?.({ type: "hardwareBackPress", timeStamp: 0 })).toBe(
      true,
    );
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("removes the subscription when the screen loses focus", async () => {
    const remove = jest.fn();
    mockAddEventListener.mockReturnValueOnce({ remove });

    const { unmount } = await renderHook(() =>
      useFocusedHardwareBackHandler(() => true),
    );
    await unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("does not register a listener on web", async () => {
    Platform.OS = "web";

    await renderHook(() => useFocusedHardwareBackHandler(() => true));

    expect(mockAddEventListener).not.toHaveBeenCalled();
  });
});
