import { renderHook } from "@testing-library/react-native";
import { AccessibilityInfo, Platform } from "react-native";
import { announce, useAnnounce } from "./announce";

describe("announce: spoken status messages", () => {
  const originalOS = Platform.OS;
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    Platform.OS = originalOS;
    spy.mockRestore();
  });

  it("speaks the message on iOS", () => {
    Platform.OS = "ios";
    announce("Code gesendet");
    expect(spy).toHaveBeenCalledWith("Code gesendet");
  });

  it("stays silent on Android, where the live region speaks", () => {
    Platform.OS = "android";
    announce("Code gesendet");
    expect(spy).not.toHaveBeenCalled();
  });

  it("ignores empty messages", () => {
    Platform.OS = "ios";
    announce("");
    expect(spy).not.toHaveBeenCalled();
  });

  it("announces again only when the message changes", async () => {
    Platform.OS = "ios";
    const { rerender } = await renderHook(
      ({ message }: { message: string | null }) => useAnnounce(message),
      { initialProps: { message: null as string | null } },
    );
    await rerender({ message: "Fehler" });
    await rerender({ message: "Fehler" });
    await rerender({ message: null });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
