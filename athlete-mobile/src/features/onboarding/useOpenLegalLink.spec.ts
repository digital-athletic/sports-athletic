import { Alert } from "@/common/Alert";
import { renderHook, waitFor } from "@testing-library/react-native";
import { Linking, Platform } from "react-native";
import { useOpenLegalLink } from "./useOpenLegalLink";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("useOpenLegalLink: opening a legal document", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the document on the WebView route in the native app", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const { result } = await renderHook(() => useOpenLegalLink("/webview"));

    result.current.openLegalLink("https://example.com/privacy");

    expect(mockPush).toHaveBeenCalledWith(
      "/webview?url=https%3A%2F%2Fexample.com%2Fprivacy",
    );
    expect(openURL).not.toHaveBeenCalled();
  });

  it("opens the document in a new browser tab on web", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const { result } = await renderHook(() => useOpenLegalLink("/webview"));

    result.current.openLegalLink("https://example.com/privacy");

    expect(openURL).toHaveBeenCalledWith("https://example.com/privacy");
    expect(mockPush).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("shows an alert when openURL rejects on web", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("invalid url"));
    const { result } = await renderHook(() => useOpenLegalLink("/webview"));

    result.current.openLegalLink("https://example.com/privacy");

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledTimes(1));
  });

  it("does nothing without a link", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const { result } = await renderHook(() => useOpenLegalLink("/webview"));

    result.current.openLegalLink("");

    expect(mockPush).not.toHaveBeenCalled();
    expect(openURL).not.toHaveBeenCalled();
  });
});
