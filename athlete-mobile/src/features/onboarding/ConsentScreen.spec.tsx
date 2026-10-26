/**
 * Unit tests for ConsentScreen
 */

import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { render } from "@/utils/testUtils";
import { ConsentScreen } from "./ConsentScreen";

const mockSaveConsentToProfile = jest.fn();
jest.mock("@/services/AuthService", () => ({
  saveConsentToProfile: (...args: unknown[]) =>
    mockSaveConsentToProfile(...args),
}));

const mockSetConsentStatus = jest.fn();
const mockSetAnonymisedDataUse = jest.fn();
const mockAcceptConsent = jest.fn();
jest.mock("@/store/userSettingsStore", () => ({
  useUserSettingsStore: (
    selector: (state: {
      setConsentStatus: typeof mockSetConsentStatus;
      setAnonymisedDataUse: typeof mockSetAnonymisedDataUse;
      acceptConsent: typeof mockAcceptConsent;
    }) => unknown,
  ) =>
    selector({
      setConsentStatus: mockSetConsentStatus,
      setAnonymisedDataUse: mockSetAnonymisedDataUse,
      acceptConsent: mockAcceptConsent,
    }),
}));

jest.mock("@/config/featureFlags", () => ({
  featureFlags: {
    termsEnabled: false,
    privacyEnabled: true,
    analyticsConsentEnabled: true,
  },
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ConsentScreen", () => {
  it("renders the consent title and subtitle", async () => {
    await render(<ConsentScreen />);

    expect(screen.getByText("Data Protection")).toBeTruthy();
    expect(
      screen.getByText(
        "Before you continue to use the app, you must agree to the privacy policy.",
      ),
    ).toBeTruthy();
  });

  it("renders a continue button", async () => {
    await render(<ConsentScreen />);

    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
  });

  it("shows error when submitting without accepting privacy", async () => {
    await render(<ConsentScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockSetConsentStatus).not.toHaveBeenCalled();
    });
    expect(
      screen.getByText(
        "You cannot continue without your agreement. Tick the box to agree to the terms.",
      ),
    ).toBeTruthy();
  });

  it("shows error when submitting without accepting analytics", async () => {
    await render(<ConsentScreen />);

    await fireEvent.press(screen.getAllByRole("checkbox")[0]);
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockSetConsentStatus).not.toHaveBeenCalled();
    });
    expect(
      screen.getByText(
        "You cannot continue without your agreement. Tick the box for usage data.",
      ),
    ).toBeTruthy();
  });

  it("saves consent when both privacy and analytics are accepted", async () => {
    mockSaveConsentToProfile.mockResolvedValue(undefined);
    await render(<ConsentScreen />);

    const checkboxes = screen.getAllByRole("checkbox");
    await fireEvent.press(checkboxes[0]);
    await fireEvent.press(checkboxes[1]);
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockSaveConsentToProfile).toHaveBeenCalledWith({
        privacyAccepted: true,
        analyticsAccepted: true,
      });
      expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(true);
      expect(mockAcceptConsent).toHaveBeenCalled();
      expect(mockSetConsentStatus).not.toHaveBeenCalledWith("accepted");
    });
  });

  it("shows save error and does not proceed when saveConsentToProfile fails", async () => {
    mockSaveConsentToProfile.mockRejectedValue(new Error("Network error"));
    await render(<ConsentScreen />);

    const checkboxes = screen.getAllByRole("checkbox");
    await fireEvent.press(checkboxes[0]);
    await fireEvent.press(checkboxes[1]);
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockSetConsentStatus).not.toHaveBeenCalled();
    });
    expect(
      screen.getByText(
        "The app could not save your agreement. Check your internet connection and try again.",
      ),
    ).toBeTruthy();
  });

  it("rapid double-press fires saveConsentToProfile exactly once", async () => {
    mockSaveConsentToProfile.mockImplementation(() => new Promise(() => {}));
    await render(<ConsentScreen />);

    const checkboxes = screen.getAllByRole("checkbox");
    await fireEvent.press(checkboxes[0]);
    await fireEvent.press(checkboxes[1]);

    const button = screen.getByRole("button", { name: "Continue" });
    // fireEvent resolves with the press handler's promise, which never settles here.
    void fireEvent.press(button);
    await waitFor(() => expect(button).toBeDisabled());
    await fireEvent.press(button);

    await waitFor(() => {
      expect(mockSaveConsentToProfile).toHaveBeenCalledTimes(1);
    });
  });
});
