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

  it("registers the handler for hardwareBackPress", async () => {
    const handler = jest.fn().mockReturnValue(true);
    await renderHook(() => useHardwareBackHandler(handler));

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "hardwareBackPress",
      handler,
    );
  });

  it("removes the subscription on unmount", async () => {
    const remove = jest.fn();
    mockAddEventListener.mockReturnValueOnce({ remove });

    const { unmount } = await renderHook(() =>
      useHardwareBackHandler(() => true),
    );
    await unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("does not register a listener on web", async () => {
    Platform.OS = "web";

    await renderHook(() => useHardwareBackHandler(() => true));

    expect(mockAddEventListener).not.toHaveBeenCalled();
  });
});
