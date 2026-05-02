/**
 * Tests for EmailVerificationScreen component
 * Tests rendering, resend functionality, OTP verification, and back navigation
 */

/* eslint-disable import/first */
import { act, fireEvent, render } from "../../utils/testUtils";

// Mock expo-router
const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams: Record<string, string> = {
  email: "user@example.com",
  mode: "REGISTER",
};
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockSearchParams,
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock supabase client
const mockVerifyOtp = jest.fn();
jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    auth: {
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    },
  },
}));

// Mock AuthService
const mockRequestLoginOtp = jest.fn();
const mockRequestRegistrationOtp = jest.fn();
const mockSaveConsentToProfile = jest.fn();
jest.mock("@/services/AuthService", () => ({
  requestLoginOtp: (...args: unknown[]) => mockRequestLoginOtp(...args),
  requestRegistrationOtp: (...args: unknown[]) =>
    mockRequestRegistrationOtp(...args),
  saveConsentToProfile: (...args: unknown[]) =>
    mockSaveConsentToProfile(...args),
}));

// Mock auth store
const mockInitializeFromSupabase = jest.fn();
jest.mock("@/store/authStore", () => ({
  useAuthStore: () => ({
    initializeFromSupabase: mockInitializeFromSupabase,
  }),
}));

// Mock user settings store
const mockSetAnonymisedDataUse = jest.fn();
jest.mock("@/store/userSettingsStore", () => ({
  useUserSettingsStore: () => ({
    setAnonymisedDataUse: mockSetAnonymisedDataUse,
  }),
}));

// Import after mocks
import { Alert } from "react-native";
import { EmailVerificationScreen } from "./EmailVerificationScreen";

describe("<EmailVerificationScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = { email: "user@example.com", mode: "REGISTER" };
    mockVerifyOtp.mockResolvedValue({ data: {}, error: null });
    mockInitializeFromSupabase.mockResolvedValue(undefined);
    mockRequestLoginOtp.mockResolvedValue(undefined);
    mockRequestRegistrationOtp.mockResolvedValue(undefined);
    mockSaveConsentToProfile.mockResolvedValue(undefined);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("renders the confirmation title", () => {
    const { getByText } = render(<EmailVerificationScreen />);
    expect(getByText("Confirm your email")).toBeTruthy();
  });

  it("renders the confirmation message", () => {
    const { getByText } = render(<EmailVerificationScreen />);
    expect(
      getByText(
        "Please check your inbox and confirm your email address to complete the registration.",
      ),
    ).toBeTruthy();
  });

  it("displays the user email address", () => {
    const { getByText } = render(<EmailVerificationScreen />);
    expect(getByText("user@example.com")).toBeTruthy();
  });

  it("renders the resend email button", () => {
    const { getByText } = render(<EmailVerificationScreen />);
    expect(getByText("Resend verification email")).toBeTruthy();
  });

  it("renders the back button", () => {
    const { getByLabelText } = render(<EmailVerificationScreen />);
    expect(getByLabelText("Back")).toBeTruthy();
  });

  it("calls requestRegistrationOtp when resending in REGISTER mode", async () => {
    const { getByText } = render(<EmailVerificationScreen />);

    await act(async () => {
      fireEvent.press(getByText("Resend verification email"));
    });

    expect(mockRequestRegistrationOtp).toHaveBeenCalledWith(
      "user@example.com",
      false,
    );
  });

  it("preserves acceptedAnalytics=true when resending in REGISTER mode", async () => {
    mockSearchParams = {
      email: "user@example.com",
      mode: "REGISTER",
      acceptedAnalytics: "true",
    };
    const { getByText } = render(<EmailVerificationScreen />);

    await act(async () => {
      fireEvent.press(getByText("Resend verification email"));
    });

    expect(mockRequestRegistrationOtp).toHaveBeenCalledWith(
      "user@example.com",
      true,
    );
  });

  it("calls requestLoginOtp when resending in LOGIN mode", async () => {
    mockSearchParams = { email: "user@example.com", mode: "LOGIN" };
    const { getByText } = render(<EmailVerificationScreen />);

    await act(async () => {
      fireEvent.press(getByText("Resend verification email"));
    });

    expect(mockRequestLoginOtp).toHaveBeenCalledWith("user@example.com");
  });

  it("shows success message after resending email", async () => {
    const { getByText, queryByText } = render(<EmailVerificationScreen />);

    expect(
      queryByText("A new verification email has been sent to your inbox."),
    ).toBeNull();

    await act(async () => {
      fireEvent.press(getByText("Resend verification email"));
    });

    expect(
      getByText("A new verification email has been sent to your inbox."),
    ).toBeTruthy();
  });

  it("navigates to onboarding when back button is pressed", () => {
    const { getByLabelText } = render(<EmailVerificationScreen />);

    fireEvent.press(getByLabelText("Back"));

    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });

  it("shows error alert when resend fails", async () => {
    mockRequestRegistrationOtp.mockRejectedValue(new Error("Rate limited"));

    const { getByText, queryByText } = render(<EmailVerificationScreen />);

    await act(async () => {
      fireEvent.press(getByText("Resend verification email"));
    });

    expect(
      queryByText("A new verification email has been sent to your inbox."),
    ).toBeNull();
    expect(Alert.alert).toHaveBeenCalled();
  });

  it("disables resend button during cooldown after successful resend", async () => {
    jest.useFakeTimers();

    const { getByText } = render(<EmailVerificationScreen />);

    await act(async () => {
      fireEvent.press(getByText("Resend verification email"));
    });

    expect(getByText(/Resend verification email \(\d+s\)/)).toBeTruthy();

    fireEvent.press(getByText(/Resend verification email \(\d+s\)/));
    expect(mockRequestRegistrationOtp).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(61000);
    });

    expect(getByText("Resend verification email")).toBeTruthy();

    jest.useRealTimers();
  });

  it("renders the OTP code input", () => {
    const { getByLabelText } = render(<EmailVerificationScreen />);
    expect(getByLabelText("Verification code")).toBeTruthy();
  });

  it("filters non-numeric characters from OTP input", () => {
    const { getByLabelText } = render(<EmailVerificationScreen />);
    const input = getByLabelText("Verification code");

    fireEvent.changeText(input, "12ab34");
    expect(input.props.value).toBe("1234");
  });

  it("calls verifyOtp with type email", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = render(<EmailVerificationScreen />);

    fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      fireEvent.press(getByText("Verify"));
    });

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "123456",
      type: "email",
    });
  });

  it("navigates to anamnesis after successful verification in REGISTER mode", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = render(<EmailVerificationScreen />);

    fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      fireEvent.press(getByText("Verify"));
    });

    expect(mockInitializeFromSupabase).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/anamnesis");
  });

  it("lets Stack.Protected handle navigation after successful LOGIN verification", async () => {
    mockSearchParams = { email: "user@example.com", mode: "LOGIN" };
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = render(<EmailVerificationScreen />);

    fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      fireEvent.press(getByText("Verify"));
    });

    expect(mockInitializeFromSupabase).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows inline error and clears OTP when verification fails", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {},
      error: { message: "Invalid token" },
    });

    const { getByLabelText, getByText, queryByText } = render(
      <EmailVerificationScreen />,
    );

    expect(queryByText(/code you entered is invalid/)).toBeNull();

    fireEvent.changeText(getByLabelText("Verification code"), "999999");

    await act(async () => {
      fireEvent.press(getByText("Verify"));
    });

    expect(getByText(/code you entered is invalid/)).toBeTruthy();
    expect(getByLabelText("Verification code").props.value).toBe("");
  });

  it("clears the error message when user types a new code", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {},
      error: { message: "Invalid token" },
    });

    const { getByLabelText, getByText, queryByText } = render(
      <EmailVerificationScreen />,
    );

    fireEvent.changeText(getByLabelText("Verification code"), "999999");

    await act(async () => {
      fireEvent.press(getByText("Verify"));
    });

    expect(queryByText(/code you entered is invalid/)).toBeTruthy();

    fireEvent.changeText(getByLabelText("Verification code"), "1");

    expect(queryByText(/code you entered is invalid/)).toBeNull();
  });

  it("upserts consent and syncs local store after successful REGISTER verification", async () => {
    mockSearchParams = {
      email: "user@example.com",
      mode: "REGISTER",
      acceptedAnalytics: "true",
    };
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = render(<EmailVerificationScreen />);
    fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      fireEvent.press(getByText("Verify"));
    });

    expect(mockSaveConsentToProfile).toHaveBeenCalledWith("user-1", {
      analytics: true,
      privacyAccepted: false,
    });
    expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(true);
    expect(mockReplace).toHaveBeenCalledWith("/anamnesis");
  });

  it("still navigates to anamnesis when consent upsert fails", async () => {
    mockSaveConsentToProfile.mockRejectedValue(new Error("network"));
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = render(<EmailVerificationScreen />);
    fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      fireEvent.press(getByText("Verify"));
    });

    expect(mockReplace).toHaveBeenCalledWith("/anamnesis");
  });

  it("does not upsert consent after successful LOGIN verification", async () => {
    mockSearchParams = { email: "user@example.com", mode: "LOGIN" };
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = render(<EmailVerificationScreen />);
    fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      fireEvent.press(getByText("Verify"));
    });

    expect(mockSaveConsentToProfile).not.toHaveBeenCalled();
  });

  it("does not call verifyOtp when code is incomplete", async () => {
    const { getByLabelText, getByText } = render(<EmailVerificationScreen />);

    fireEvent.changeText(getByLabelText("Verification code"), "123");

    await act(async () => {
      fireEvent.press(getByText("Verify"));
    });

    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });
});
