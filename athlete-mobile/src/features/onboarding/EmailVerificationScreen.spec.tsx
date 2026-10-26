/**
 * Tests for EmailVerificationScreen component
 * Tests rendering, resend functionality, OTP verification, and back navigation
 */

import { act, fireEvent, render } from "../../utils/testUtils";
import { Alert } from "react-native";
import { EmailVerificationScreen } from "./EmailVerificationScreen";

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
const mockSetAuth = jest.fn();
jest.mock("@/store/authStore", () => ({
  useAuthStore: Object.assign(
    (
      selector: (state: {
        initializeFromSupabase: typeof mockInitializeFromSupabase;
      }) => unknown,
    ) => selector({ initializeFromSupabase: mockInitializeFromSupabase }),
    {
      getState: () => ({ setAuth: mockSetAuth }),
    },
  ),
}));

// Mock user settings store
const mockSetAnonymisedDataUse = jest.fn();
const mockSetConsentStatus = jest.fn();
const mockAcceptConsent = jest.fn();
jest.mock("@/store/userSettingsStore", () => ({
  useUserSettingsStore: (
    selector: (state: {
      setAnonymisedDataUse: typeof mockSetAnonymisedDataUse;
      setConsentStatus: typeof mockSetConsentStatus;
      acceptConsent: typeof mockAcceptConsent;
    }) => unknown,
  ) =>
    selector({
      setAnonymisedDataUse: mockSetAnonymisedDataUse,
      setConsentStatus: mockSetConsentStatus,
      acceptConsent: mockAcceptConsent,
    }),
}));

// Mock registration consent store
let mockPendingConsent: {
  analyticsAccepted: boolean;
  termsAccepted: boolean;
} | null = null;
const mockClearPendingConsent = jest.fn();
jest.mock("@/store/registrationConsentStore", () => ({
  useRegistrationConsentStore: (
    selector: (state: {
      pendingConsent: typeof mockPendingConsent;
      clearPendingConsent: typeof mockClearPendingConsent;
    }) => unknown,
  ) =>
    selector({
      get pendingConsent() {
        return mockPendingConsent;
      },
      clearPendingConsent: mockClearPendingConsent,
    }),
}));

describe("<EmailVerificationScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = { email: "user@example.com", mode: "REGISTER" };
    mockPendingConsent = null;
    mockVerifyOtp.mockResolvedValue({ data: {}, error: null });
    mockInitializeFromSupabase.mockResolvedValue(undefined);
    mockRequestLoginOtp.mockResolvedValue(undefined);
    mockRequestRegistrationOtp.mockResolvedValue(undefined);
    mockSaveConsentToProfile.mockResolvedValue(undefined);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("renders the confirmation title", async () => {
    const { getByText } = await render(<EmailVerificationScreen />);
    expect(getByText("Confirm your email")).toBeTruthy();
  });

  it("renders the confirmation message", async () => {
    const { getByText } = await render(<EmailVerificationScreen />);
    expect(
      getByText("We sent you an email with a code. Look in your inbox."),
    ).toBeTruthy();
  });

  it("displays the user email address", async () => {
    const { getByText } = await render(<EmailVerificationScreen />);
    expect(getByText("user@example.com")).toBeTruthy();
  });

  it("renders the resend email button", async () => {
    const { getByText } = await render(<EmailVerificationScreen />);
    expect(getByText("Send code again")).toBeTruthy();
  });

  it("renders the back button", async () => {
    const { getByLabelText } = await render(<EmailVerificationScreen />);
    expect(getByLabelText("Back")).toBeTruthy();
  });

  it("calls requestRegistrationOtp when resending in REGISTER mode", async () => {
    const { getByText } = await render(<EmailVerificationScreen />);

    await act(async () => {
      await fireEvent.press(getByText("Send code again"));
    });

    expect(mockRequestRegistrationOtp).toHaveBeenCalledWith(
      "user@example.com",
      false,
    );
  });

  it("preserves analyticsAccepted=true from store when resending in REGISTER mode", async () => {
    mockPendingConsent = { analyticsAccepted: true, termsAccepted: false };
    const { getByText } = await render(<EmailVerificationScreen />);

    await act(async () => {
      await fireEvent.press(getByText("Send code again"));
    });

    expect(mockRequestRegistrationOtp).toHaveBeenCalledWith(
      "user@example.com",
      true,
    );
  });

  it("calls requestLoginOtp when resending in LOGIN mode", async () => {
    mockSearchParams = { email: "user@example.com", mode: "LOGIN" };
    const { getByText } = await render(<EmailVerificationScreen />);

    await act(async () => {
      await fireEvent.press(getByText("Send code again"));
    });

    expect(mockRequestLoginOtp).toHaveBeenCalledWith("user@example.com");
  });

  it("shows success message after resending email", async () => {
    const { getByText, queryByText } = await render(
      <EmailVerificationScreen />,
    );

    expect(queryByText("The app sent you a new code.")).toBeNull();

    await act(async () => {
      await fireEvent.press(getByText("Send code again"));
    });

    expect(getByText("The app sent you a new code.")).toBeTruthy();
  });

  it("navigates to onboarding when back button is pressed", async () => {
    const { getByLabelText } = await render(<EmailVerificationScreen />);

    await fireEvent.press(getByLabelText("Back"));

    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });

  it("shows error alert when resend fails", async () => {
    mockRequestRegistrationOtp.mockRejectedValue(new Error("Rate limited"));

    const { getByText, queryByText } = await render(
      <EmailVerificationScreen />,
    );

    await act(async () => {
      await fireEvent.press(getByText("Send code again"));
    });

    expect(queryByText("The app sent you a new code.")).toBeNull();
    expect(Alert.alert).toHaveBeenCalled();
  });

  it("disables resend button during cooldown after successful resend", async () => {
    jest.useFakeTimers();

    const { getByText } = await render(<EmailVerificationScreen />);

    await act(async () => {
      await fireEvent.press(getByText("Send code again"));
    });

    expect(getByText(/Send code again \(\d+s\)/)).toBeTruthy();

    await fireEvent.press(getByText(/Send code again \(\d+s\)/));
    expect(mockRequestRegistrationOtp).toHaveBeenCalledTimes(1);

    await act(() => {
      jest.advanceTimersByTime(61000);
    });

    expect(getByText("Send code again")).toBeTruthy();

    jest.useRealTimers();
  });

  it("renders the OTP code input", async () => {
    const { getByLabelText } = await render(<EmailVerificationScreen />);
    expect(getByLabelText("Verification code")).toBeTruthy();
  });

  it("filters non-numeric characters from OTP input", async () => {
    const { getByLabelText } = await render(<EmailVerificationScreen />);
    const input = getByLabelText("Verification code");

    await fireEvent.changeText(input, "12ab34");
    expect(input.props.value).toBe("1234");
  });

  it("calls verifyOtp with type email", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = await render(
      <EmailVerificationScreen />,
    );

    await fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
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

    const { getByLabelText, getByText } = await render(
      <EmailVerificationScreen />,
    );

    await fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
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

    const { getByLabelText, getByText } = await render(
      <EmailVerificationScreen />,
    );

    await fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
    });

    expect(mockInitializeFromSupabase).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows inline error and clears OTP when verification fails", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {},
      error: { message: "Invalid token" },
    });

    const { getByLabelText, getByText, queryByText } = await render(
      <EmailVerificationScreen />,
    );

    expect(queryByText(/The code is wrong or has expired/)).toBeNull();

    await fireEvent.changeText(getByLabelText("Verification code"), "999999");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
    });

    expect(getByText(/The code is wrong or has expired/)).toBeTruthy();
    expect(getByLabelText("Verification code").props.value).toBe("");
  });

  it("clears the error message when user types a new code", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {},
      error: { message: "Invalid token" },
    });

    const { getByLabelText, getByText, queryByText } = await render(
      <EmailVerificationScreen />,
    );

    await fireEvent.changeText(getByLabelText("Verification code"), "999999");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
    });

    expect(queryByText(/The code is wrong or has expired/)).toBeTruthy();

    await fireEvent.changeText(getByLabelText("Verification code"), "1");

    expect(queryByText(/The code is wrong or has expired/)).toBeNull();
  });

  it("upserts consent and syncs local store after successful REGISTER verification", async () => {
    // Consent flags come from the in-memory store, not URL params.
    // termsAccepted is false because the registration screen omits the privacy
    // checkbox when privacyEnabled is false; the consent gate only enforces it when
    // featureFlags.privacyEnabled is true.
    mockPendingConsent = { analyticsAccepted: true, termsAccepted: false };
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = await render(
      <EmailVerificationScreen />,
    );
    await fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
    });

    expect(mockSaveConsentToProfile).toHaveBeenCalledWith({
      analyticsAccepted: true,
      privacyAccepted: false,
    });
    expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(true);
    expect(mockAcceptConsent).toHaveBeenCalled();
    expect(mockClearPendingConsent).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/anamnesis");
  });

  it("sets consentStatus to accepted in REGISTER path after successful verification", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = await render(
      <EmailVerificationScreen />,
    );
    await fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
    });

    expect(mockAcceptConsent).toHaveBeenCalled();
    expect(mockSetConsentStatus).not.toHaveBeenCalledWith("accepted");
  });

  it("does not call setConsentStatus in LOGIN path after successful verification", async () => {
    mockSearchParams = { email: "user@example.com", mode: "LOGIN" };
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = await render(
      <EmailVerificationScreen />,
    );
    await fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
    });

    expect(mockSetConsentStatus).not.toHaveBeenCalled();
  });

  it("sets consentStatus to missing and navigates to anamnesis when consent save fails — consent gate handles retry", async () => {
    mockSaveConsentToProfile.mockRejectedValue(new Error("network"));
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = await render(
      <EmailVerificationScreen />,
    );
    await fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
    });

    // Fail closed: no server record means no access. Stack.Protected intercepts
    // the /anamnesis navigation and shows ConsentScreen for retry.
    expect(mockSetConsentStatus).toHaveBeenCalledWith("missing");
    expect(mockSetConsentStatus).not.toHaveBeenCalledWith("accepted");
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

    const { getByLabelText, getByText } = await render(
      <EmailVerificationScreen />,
    );
    await fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
    });

    expect(mockSaveConsentToProfile).not.toHaveBeenCalled();
  });

  it("saves consent with false/false when pendingConsent is null — guards against deep-link bypass", async () => {
    mockPendingConsent = null;
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { user: { id: "user-1" }, access_token: "token-1" },
      },
      error: null,
    });

    const { getByLabelText, getByText } = await render(
      <EmailVerificationScreen />,
    );
    await fireEvent.changeText(getByLabelText("Verification code"), "123456");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
    });

    expect(mockSaveConsentToProfile).toHaveBeenCalledWith({
      privacyAccepted: false,
      analyticsAccepted: false,
    });
  });

  it("does not call verifyOtp when code is incomplete", async () => {
    const { getByLabelText, getByText } = await render(
      <EmailVerificationScreen />,
    );

    await fireEvent.changeText(getByLabelText("Verification code"), "123");

    await act(async () => {
      await fireEvent.press(getByText("Verify"));
    });

    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  describe("review user bypass", () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_REVIEW_EMAIL = "reviewer@example.com";
      process.env.EXPO_PUBLIC_REVIEW_OTP = "654321";
      mockSearchParams = { email: "reviewer@example.com", mode: "REGISTER" };
    });

    afterEach(() => {
      delete process.env.EXPO_PUBLIC_REVIEW_EMAIL;
      delete process.env.EXPO_PUBLIC_REVIEW_OTP;
    });

    it("bypasses supabase and marks consent accepted for review user in REGISTER mode", async () => {
      const { getByLabelText, getByText } = await render(
        <EmailVerificationScreen />,
      );
      await fireEvent.changeText(getByLabelText("Verification code"), "654321");

      await act(async () => {
        await fireEvent.press(getByText("Verify"));
      });

      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
      expect(mockAcceptConsent).not.toHaveBeenCalled();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it("navigates to anamnesis for review user in REGISTER mode", async () => {
      const { getByLabelText, getByText } = await render(
        <EmailVerificationScreen />,
      );
      await fireEvent.changeText(getByLabelText("Verification code"), "654321");

      await act(async () => {
        await fireEvent.press(getByText("Verify"));
      });

      expect(mockReplace).toHaveBeenCalledWith("/anamnesis");
    });

    it("bypasses supabase and marks consent accepted for review user in LOGIN mode", async () => {
      mockSearchParams = { email: "reviewer@example.com", mode: "LOGIN" };
      const { getByLabelText, getByText } = await render(
        <EmailVerificationScreen />,
      );
      await fireEvent.changeText(getByLabelText("Verification code"), "654321");

      await act(async () => {
        await fireEvent.press(getByText("Verify"));
      });

      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
      expect(mockAcceptConsent).not.toHaveBeenCalled();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("falls through to supabase verifyOtp when OTP does not match review OTP", async () => {
      const { getByLabelText, getByText } = await render(
        <EmailVerificationScreen />,
      );
      await fireEvent.changeText(getByLabelText("Verification code"), "000000");

      await act(async () => {
        await fireEvent.press(getByText("Verify"));
      });

      expect(mockVerifyOtp).toHaveBeenCalled();
      expect(mockAcceptConsent).not.toHaveBeenCalled();
    });
  });
});
