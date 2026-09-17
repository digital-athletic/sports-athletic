import { renderHook } from "@testing-library/react-native";
import { BackHandler, Platform } from "react-native";
import { useHardwareBackHandler } from "./useHardwareBackHandler";

const mockAddEventListener = jest
  .spyOn(BackHandler, "addEventListener")
  .mockReturnValue({ remove: jest.fn() });

describe("useHardwareBackHandler", () => {
  beforeEach(() => {
    mockAddEventListener.mockClear();
    Platform.OS = "ios";
  });

  it("registers the handler for hardwareBackPress", () => {
    const handler = jest.fn().mockReturnValue(true);
    renderHook(() => useHardwareBackHandler(handler));

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "hardwareBackPress",
      handler,
    );
  });

  it("removes the subscription on unmount", () => {
    const remove = jest.fn();
    mockAddEventListener.mockReturnValueOnce({ remove });

    const { unmount } = renderHook(() => useHardwareBackHandler(() => true));
    unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("does not register a listener on web", () => {
    Platform.OS = "web";

    renderHook(() => useHardwareBackHandler(() => true));

    expect(mockAddEventListener).not.toHaveBeenCalled();
  });
});
