/**
 * Tests for EmailVerificationScreen component
 * Tests rendering, resend functionality, and back navigation
 */

/* eslint-disable import/first */
import { act, fireEvent, render } from "../../utils/testUtils";

// Mock expo-router
const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ email: "user@example.com" }),
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock supabase client
const mockResend = jest.fn();
const mockVerifyOtp = jest.fn();
jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    auth: {
      resend: (...args: unknown[]) => mockResend(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    },
  },
}));

// Mock auth store
const mockInitializeFromSupabase = jest.fn();
jest.mock("@/store/authStore", () => ({
  useAuthStore: () => ({
    initializeFromSupabase: mockInitializeFromSupabase,
  }),
}));

// Import after mocks
import { Alert } from "react-native";
import { EmailVerificationScreen } from "./EmailVerificationScreen";

describe("<EmailVerificationScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResend.mockResolvedValue({ error: null });
    mockVerifyOtp.mockResolvedValue({ data: {}, error: null });
    mockInitializeFromSupabase.mockResolvedValue(undefined);
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
    const { getByText } = render(<EmailVerificationScreen />);
    expect(getByText("Back")).toBeTruthy();
  });

  it("calls supabase resend when resend button is pressed", async () => {
    const { getByText } = render(<EmailVerificationScreen />);

    await act(async () => {
      fireEvent.press(getByText("Resend verification email"));
    });

    expect(mockResend).toHaveBeenCalledWith({
      type: "signup",
      email: "user@example.com",
    });
  });

  it("shows success message after resending email", async () => {
    const { getByText, queryByText } = render(<EmailVerificationScreen />);

    // Success message not shown initially
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
    const { getByText } = render(<EmailVerificationScreen />);

    fireEvent.press(getByText("Back"));

    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });

  it("disables resend button while loading", async () => {
    // Make resend take a long time
    let resolveResend: (value: unknown) => void;
    mockResend.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveResend = resolve;
        }),
    );

    const { getByText } = render(<EmailVerificationScreen />);

    fireEvent.press(getByText("Resend verification email"));

    // The resend button should show loading state
    expect(mockResend).toHaveBeenCalledTimes(1);

    // Pressing again should not trigger another call (disabled while loading)
    fireEvent.press(getByText("Resend verification email"));
    expect(mockResend).toHaveBeenCalledTimes(1);

    // Cleanup: resolve the promise
    await act(async () => {
      resolveResend!({ error: null });
    });
  });

  it("shows error alert when resend fails", async () => {
    mockResend.mockResolvedValue({
      error: { message: "Rate limit exceeded" },
    });

    const { getByText, queryByText } = render(<EmailVerificationScreen />);

    await act(async () => {
      fireEvent.press(getByText("Resend verification email"));
    });

    // Should not show success message on error
    expect(
      queryByText("A new verification email has been sent to your inbox."),
    ).toBeNull();

    // Should show error alert
    expect(Alert.alert).toHaveBeenCalled();
  });

  it("disables resend button during cooldown after successful resend", async () => {
    jest.useFakeTimers();

    const { getByText } = render(<EmailVerificationScreen />);

    await act(async () => {
      fireEvent.press(getByText("Resend verification email"));
    });

    // After successful resend, button should show cooldown
    expect(getByText(/Resend verification email \(\d+s\)/)).toBeTruthy();

    // Second press should not trigger another call
    fireEvent.press(getByText(/Resend verification email \(\d+s\)/));
    expect(mockResend).toHaveBeenCalledTimes(1);

    // Advance past cooldown
    act(() => {
      jest.advanceTimersByTime(61000);
    });

    // Button should be enabled again
    expect(getByText("Resend verification email")).toBeTruthy();

    jest.useRealTimers();
  });

  it("renders the OTP code input", () => {
    const { getByLabelText } = render(<EmailVerificationScreen />);
    expect(getByLabelText("Verification code")).toBeTruthy();
  });

  it("renders the verify button", () => {
    const { getByText } = render(<EmailVerificationScreen />);
    expect(getByText("Verify")).toBeTruthy();
  });

  it("filters non-numeric characters from OTP input", () => {
    const { getByLabelText } = render(<EmailVerificationScreen />);
    const input = getByLabelText("Verification code");

    fireEvent.changeText(input, "12ab34");
    expect(input.props.value).toBe("1234");
  });

  it("calls verifyOtp with correct parameters when verify is pressed", async () => {
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
      type: "signup",
    });
  });

  it("navigates to anamnesis after successful verification", async () => {
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

  it("shows inline error and clears OTP when verification fails", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {},
      error: { message: "Invalid token" },
    });

    const { getByLabelText, getByText, queryByText } = render(
      <EmailVerificationScreen />,
    );

    // No error message initially
    expect(queryByText(/code you entered is invalid/)).toBeNull();

    fireEvent.changeText(getByLabelText("Verification code"), "999999");

    await act(async () => {
      fireEvent.press(getByText("Verify"));
    });

    // Inline error message is shown
    expect(getByText(/code you entered is invalid/)).toBeTruthy();

    // OTP input is cleared
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

    // Error is shown
    expect(queryByText(/code you entered is invalid/)).toBeTruthy();

    // User starts typing a new code
    fireEvent.changeText(getByLabelText("Verification code"), "1");

    // Error is cleared
    expect(queryByText(/code you entered is invalid/)).toBeNull();
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
