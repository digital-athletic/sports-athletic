import { LoginScreen } from "@/features/onboarding/LoginScreen";
import { RegistrationScreen } from "@/features/onboarding/RegisterScreen";
import { Box } from "@/theme/Box";
import { featureFlags } from "@/config/featureFlags";
import { useRouter } from "expo-router";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import {
  requestLoginOtp,
  requestRegistrationOtp,
} from "../../src/services/AuthService";
import { validateEmail } from "../../src/utils/ValidationUtils";

/**
 * Onboarding Screen
 *
 * Main onboarding screen for authentication (login/registration)
 * Uses passwordless OTP flow: email → send code → verify
 */

type ErrorField = "email" | "privacy" | "analytics";

type OnboardingState = {
  email: string;
  activeType: "LOGIN" | "REGISTER";
  acceptedPrivacy: boolean;
  acceptedAnalytics: boolean;
  processing: boolean;
  registrationError: string | null;
  errorFields: ErrorField[];
};

type OnboardingAction =
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_ACTIVE_TYPE"; payload: "LOGIN" | "REGISTER" }
  | { type: "TOGGLE_PRIVACY" }
  | { type: "TOGGLE_ANALYTICS" }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "SET_REGISTRATION_ERROR"; payload: string | null }
  | { type: "SET_ERROR_FIELDS"; payload: ErrorField[] }
  | { type: "RESET" };

const initialState: OnboardingState = {
  email: "",
  activeType: "LOGIN",
  acceptedPrivacy: false,
  acceptedAnalytics: false,
  processing: false,
  registrationError: null,
  errorFields: [],
};

function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
  switch (action.type) {
    case "SET_EMAIL":
      return {
        ...state,
        email: action.payload,
        registrationError: null,
        errorFields: state.errorFields.filter((f) => f !== "email"),
      };
    case "SET_ACTIVE_TYPE":
      return { ...state, activeType: action.payload };
    case "TOGGLE_PRIVACY":
      return {
        ...state,
        acceptedPrivacy: !state.acceptedPrivacy,
        registrationError: null,
        errorFields: state.errorFields.filter((f) => f !== "privacy"),
      };
    case "TOGGLE_ANALYTICS":
      return {
        ...state,
        acceptedAnalytics: !state.acceptedAnalytics,
        registrationError: null,
        errorFields: state.errorFields.filter((f) => f !== "analytics"),
      };
    case "SET_PROCESSING":
      return { ...state, processing: action.payload };
    case "SET_REGISTRATION_ERROR":
      return { ...state, registrationError: action.payload };
    case "SET_ERROR_FIELDS":
      return { ...state, errorFields: action.payload };
    case "RESET":
      return {
        ...state,
        activeType: "LOGIN",
        acceptedPrivacy: false,
        acceptedAnalytics: false,
        registrationError: null,
        errorFields: [],
      };
    default:
      return state;
  }
}

export default function OnboardingScreen() {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!validateEmail(state.email)) {
      Alert.alert(
        t("onboarding.errorInvalidMailAdressTitle"),
        t("onboarding.errorInvalidMailAdressMsg"),
      );
      return;
    }

    dispatch({ type: "SET_PROCESSING", payload: true });
    Keyboard.dismiss();

    if (featureFlags.isReviewUser(state.email)) {
      router.push({
        pathname: "/onboarding/email-verification",
        params: { email: state.email, mode: "LOGIN" },
      });
      dispatch({ type: "SET_PROCESSING", payload: false });
      return;
    }

    try {
      await requestLoginOtp(state.email);
    } catch (error: any) {
      // Silently proceed for user-not-found to prevent user enumeration
      if (error.code !== "auth/user-not-found") {
        const message =
          error.code === "auth/too-many-requests"
            ? t("onboarding.errorMessageTooManyRequests")
            : t("onboarding.alertAnErrorOccuredTitle");
        Alert.alert(t("onboarding.alertErrorTitle"), message);
        dispatch({ type: "SET_PROCESSING", payload: false });
        return;
      }
    }

    router.push({
      pathname: "/onboarding/email-verification",
      params: { email: state.email, mode: "LOGIN" },
    });
    dispatch({ type: "SET_PROCESSING", payload: false });
  };

  const handleRegister = async () => {
    if (!validateEmail(state.email)) {
      dispatch({
        type: "SET_REGISTRATION_ERROR",
        payload: t("onboarding.invalidEmail"),
      });
      dispatch({ type: "SET_ERROR_FIELDS", payload: ["email"] });
      return;
    }

    if (featureFlags.privacyEnabled && !state.acceptedPrivacy) {
      dispatch({
        type: "SET_REGISTRATION_ERROR",
        payload: t("onboarding.errorMessageAcceptPrivacyInfo"),
      });
      dispatch({ type: "SET_ERROR_FIELDS", payload: ["privacy"] });
      return;
    }

    if (featureFlags.analyticsConsentEnabled && !state.acceptedAnalytics) {
      dispatch({
        type: "SET_REGISTRATION_ERROR",
        payload: t("onboarding.errorMessageAcceptAnalytics"),
      });
      dispatch({ type: "SET_ERROR_FIELDS", payload: ["analytics"] });
      return;
    }

    dispatch({ type: "SET_PROCESSING", payload: true });
    Keyboard.dismiss();

    if (featureFlags.isReviewUser(state.email)) {
      router.push({
        pathname: "/onboarding/email-verification",
        params: {
          email: state.email,
          mode: "REGISTER",
          acceptedAnalytics: String(state.acceptedAnalytics),
          acceptedTerms: String(state.acceptedPrivacy),
        },
      });
      dispatch({ type: "SET_PROCESSING", payload: false });
      return;
    }

    try {
      await requestRegistrationOtp(state.email, state.acceptedAnalytics);
    } catch (error: any) {
      // Silently proceed for email-already-in-use to prevent user enumeration
      if (error.code !== "auth/email-already-in-use") {
        let message = t("onboarding.errorUnknownMsgRetry");
        let fields: ErrorField[] = [];

        if (error.code === "auth/invalid-email") {
          message = t("onboarding.invalidEmail");
          fields = ["email"];
        } else if (error.code === "auth/network-request-failed") {
          message = t("onboarding.errorMessageNoInternetConnection");
        } else if (error.code === "auth/too-many-requests") {
          message = t("onboarding.errorMessageTooManyRequests");
        }

        dispatch({ type: "SET_REGISTRATION_ERROR", payload: message });
        if (fields.length > 0) {
          dispatch({ type: "SET_ERROR_FIELDS", payload: fields });
        }
        dispatch({ type: "SET_PROCESSING", payload: false });
        return;
      }
    }

    router.push({
      pathname: "/onboarding/email-verification",
      params: {
        email: state.email,
        mode: "REGISTER",
        acceptedAnalytics: String(state.acceptedAnalytics),
        acceptedTerms: String(state.acceptedPrivacy),
      },
    });
    dispatch({ type: "SET_PROCESSING", payload: false });
  };

  const handleBack = () => {
    dispatch({ type: "RESET" });
  };

  const handleGoToSignup = () => {
    dispatch({ type: "SET_ACTIVE_TYPE", payload: "REGISTER" });
  };

  const renderContent = () => {
    if (state.activeType !== "REGISTER") {
      return (
        <LoginScreen
          email={state.email}
          onEmailChange={(email) =>
            dispatch({ type: "SET_EMAIL", payload: email })
          }
          onLogin={handleLogin}
          onSignup={handleGoToSignup}
          processing={state.processing}
        />
      );
    }

    return (
      <RegistrationScreen
        email={state.email}
        acceptedPrivacy={state.acceptedPrivacy}
        acceptedAnalytics={state.acceptedAnalytics}
        registrationError={state.registrationError}
        errorFields={state.errorFields}
        onEmailChange={(email) =>
          dispatch({ type: "SET_EMAIL", payload: email })
        }
        onPrivacyToggle={() => dispatch({ type: "TOGGLE_PRIVACY" })}
        onAnalyticsToggle={() => dispatch({ type: "TOGGLE_ANALYTICS" })}
        onRegister={handleRegister}
        onBack={handleBack}
        processing={state.processing}
      />
    );
  };

  if (Platform.OS === "web") {
    return (
      <Box
        flex={1}
        justifyContent="space-between"
        alignItems="stretch"
        backgroundColor="white"
      >
        {renderContent()}
      </Box>
    );
  }

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <Box
        flex={1}
        justifyContent="space-between"
        alignItems="stretch"
        backgroundColor="white"
      >
        {renderContent()}
      </Box>
    </TouchableWithoutFeedback>
  );
}
