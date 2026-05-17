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
jest.mock("@/store/userSettingsStore", () => ({
  useUserSettingsStore: (
    selector: (state: {
      setConsentStatus: typeof mockSetConsentStatus;
      setAnonymisedDataUse: typeof mockSetAnonymisedDataUse;
    }) => unknown,
  ) =>
    selector({
      setConsentStatus: mockSetConsentStatus,
      setAnonymisedDataUse: mockSetAnonymisedDataUse,
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
  it("renders the consent title and subtitle", () => {
    render(<ConsentScreen />);

    expect(screen.getByText("Data Protection")).toBeTruthy();
    expect(
      screen.getByText(
        "To continue using the app, please accept our privacy policy.",
      ),
    ).toBeTruthy();
  });

  it("renders a continue button", () => {
    render(<ConsentScreen />);

    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
  });

  it("shows error when submitting without accepting privacy", async () => {
    render(<ConsentScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockSetConsentStatus).not.toHaveBeenCalled();
    });
    expect(
      screen.getByText(
        "Please accept our terms and conditions and privacy regulations.",
      ),
    ).toBeTruthy();
  });

  it("shows error when submitting without accepting analytics", async () => {
    render(<ConsentScreen />);

    fireEvent.press(screen.getAllByRole("checkbox")[0]);
    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockSetConsentStatus).not.toHaveBeenCalled();
    });
    expect(
      screen.getByText(
        "Please agree to help improve the app by sharing usage data.",
      ),
    ).toBeTruthy();
  });

  it("saves consent when both privacy and analytics are accepted", async () => {
    mockSaveConsentToProfile.mockResolvedValue(undefined);
    render(<ConsentScreen />);

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.press(checkboxes[0]);
    fireEvent.press(checkboxes[1]);
    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockSaveConsentToProfile).toHaveBeenCalledWith({
        privacyAccepted: true,
        analyticsAccepted: true,
      });
      expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(true);
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
  });

  it("shows save error and does not proceed when saveConsentToProfile fails", async () => {
    mockSaveConsentToProfile.mockRejectedValue(new Error("Network error"));
    render(<ConsentScreen />);

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.press(checkboxes[0]);
    fireEvent.press(checkboxes[1]);
    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockSetConsentStatus).not.toHaveBeenCalled();
    });
    expect(
      screen.getByText(
        "Your consent could not be saved. Please check your connection and try again.",
      ),
    ).toBeTruthy();
  });
});
