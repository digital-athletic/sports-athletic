import { EmailInputScreen } from "@/features/onboarding/EmailInputScreen";
import { LoginScreen } from "@/features/onboarding/LoginScreen";
import { RegistrationScreen } from "@/features/onboarding/RegisterScreen";
import { Box } from "@/theme/Box";
import { useRouter } from "expo-router";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Keyboard, TouchableWithoutFeedback } from "react-native";
import {
  checkEmailExists,
  registerWithEmail,
  resetPassword,
  signInWithEmail,
} from "../../src/services/AuthService";
import { useAuthStore } from "../../src/store/authStore";
import { useUserProfileStore } from "../../src/store/userProfileStore";
import {
  validateEmail,
  validatePassword,
} from "../../src/utils/ValidationUtils";

/**
 * Onboarding Screen
 *
 * Main onboarding screen for authentication (login/registration)
 * Migrated from legacy/views/onboarding/Onboarding.js
 */

type OnboardingState = {
  email: string;
  password: string;
  passwordConfirm: string;
  activeType: null | "LOGIN" | "REGISTER";
  acceptedPrivacy: boolean;
  acceptedAnalytics: boolean;
  processing: boolean;
  passwordError: string | null;
};

type OnboardingAction =
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_PASSWORD"; payload: string }
  | { type: "SET_PASSWORD_CONFIRM"; payload: string }
  | { type: "SET_ACTIVE_TYPE"; payload: "LOGIN" | "REGISTER" | null }
  | { type: "TOGGLE_PRIVACY" }
  | { type: "TOGGLE_ANALYTICS" }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "SET_PASSWORD_ERROR"; payload: string | null }
  | { type: "RESET" };

const initialState: OnboardingState = {
  email: "",
  password: "",
  passwordConfirm: "",
  activeType: null,
  acceptedPrivacy: false,
  acceptedAnalytics: false,
  processing: false,
  passwordError: null,
};

function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.payload };
    case "SET_PASSWORD":
      return { ...state, password: action.payload, passwordError: null };
    case "SET_PASSWORD_CONFIRM":
      return { ...state, passwordConfirm: action.payload, passwordError: null };
    case "SET_ACTIVE_TYPE":
      return { ...state, activeType: action.payload };
    case "TOGGLE_PRIVACY":
      return { ...state, acceptedPrivacy: !state.acceptedPrivacy };
    case "TOGGLE_ANALYTICS":
      return { ...state, acceptedAnalytics: !state.acceptedAnalytics };
    case "SET_PROCESSING":
      return { ...state, processing: action.payload };
    case "SET_PASSWORD_ERROR":
      return { ...state, passwordError: action.payload };
    case "RESET":
      return {
        ...state,
        password: "",
        passwordConfirm: "",
        activeType: null,
        acceptedPrivacy: false,
        acceptedAnalytics: false,
        passwordError: null,
      };
    default:
      return state;
  }
}

export default function OnboardingScreen() {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const router = useRouter();
  const { t } = useTranslation();
  const { setAuth } = useAuthStore();
  const { setIsInInitialAnamnesis } = useUserProfileStore();

  const handleEmailSubmit = async () => {
    if (!validateEmail(state.email)) {
      Alert.alert(
        t("onboarding.errorInvalidMailAdressTitle"),
        t("onboarding.errorInvalidMailAdressMsg"),
      );
      return;
    }

    dispatch({ type: "SET_PROCESSING", payload: true });
    try {
      const exists = await checkEmailExists(state.email);
      dispatch({
        type: "SET_ACTIVE_TYPE",
        payload: exists ? "LOGIN" : "REGISTER",
      });
    } catch {
      Alert.alert(
        t("onboarding.alertErrorTitle"),
        t("onboarding.alertAnErrorOccuredTitle"),
      );
    } finally {
      dispatch({ type: "SET_PROCESSING", payload: false });
    }
  };

  const handleLogin = async () => {
    dispatch({ type: "SET_PROCESSING", payload: true });
    Keyboard.dismiss();

    try {
      const auth = await signInWithEmail(state.email, state.password);
      setAuth(auth);
      router.replace("/(tabs)");
    } catch (error: any) {
      let title = t("onboarding.errorTitleWrongOrNoPassword");
      let message = t("onboarding.errorMessageWrongOrNoPassword");

      if (error.code === "auth/user-not-found") {
        title = t("onboarding.alertErrorUserNotFoundTitle");
        message = t("onboarding.alertErrorUserNotFoundMessage", {
          email: state.email,
        });
      }

      Alert.alert(title, message);
    } finally {
      dispatch({ type: "SET_PROCESSING", payload: false });
    }
  };

  const handleRegister = async () => {
    // Validate privacy acceptance
    if (!state.acceptedPrivacy) {
      Alert.alert(
        t("onboarding.errorTitleAcceptPrivacyInfo"),
        t("onboarding.errorMessageAcceptPrivacyInfo"),
      );
      return;
    }

    // Validate password
    if (state.password === "") {
      Alert.alert(
        t("onboarding.errorTitleWrongOrNoPassword"),
        t("onboarding.errorMessageNoPassword"),
      );
      return;
    }

    if (!validatePassword(state.password)) {
      Alert.alert(
        t("onboarding.errorTitleWrongOrNoPassword"),
        t("onboarding.errorMessageWeakPassword"),
      );
      return;
    }

    // Validate password confirmation
    if (state.password !== state.passwordConfirm) {
      Alert.alert(
        t("onboarding.errorTitleWrongOrNoPassword"),
        t("onboarding.errorMessageDifferentPasswords"),
      );
      return;
    }

    dispatch({ type: "SET_PROCESSING", payload: true });
    Keyboard.dismiss();

    try {
      const auth = await registerWithEmail(
        state.email,
        state.password,
        state.acceptedAnalytics,
      );
      setAuth(auth);
      setIsInInitialAnamnesis(true);
      router.replace("/anamnesis");
    } catch (error: any) {
      let message = t("onboarding.errorUnknownMsgRetry");

      if (error.code === "auth/email-already-in-use") {
        message = t("onboarding.errorMessageEmailInUse");
      } else if (error.code === "auth/weak-password") {
        message = t("onboarding.errorMessageWeakPassword");
      } else if (error.code === "auth/invalid-email") {
        message = t("onboarding.invalidEmail");
      } else if (error.code === "auth/network-request-failed") {
        message = t("onboarding.errorMessageNoInternetConnection");
      }

      Alert.alert(t("onboarding.errorTitleRegistration"), message);
    } finally {
      dispatch({ type: "SET_PROCESSING", payload: false });
    }
  };

  const handleResetPassword = async () => {
    if (!validateEmail(state.email)) {
      Alert.alert(
        t("onboarding.errorInvalidMailAdressTitle"),
        t("onboarding.errorInvalidMailAdressMsg"),
      );
      return;
    }

    try {
      await resetPassword(state.email);
      Alert.alert(
        t("onboarding.onboardingLoginSentLinkTitle"),
        t("onboarding.onboardingLoginSentLinkMessage", { email: state.email }),
      );
    } catch (error: any) {
      let title = t("onboarding.alertErrorTitle");
      let message = t("onboarding.alertAnErrorOccuredTitle");

      if (error.code === "auth/user-not-found") {
        title = t("onboarding.alertErrorUserNotFoundTitle");
        message = t("onboarding.alertErrorUserNotFoundMessage", {
          email: state.email,
        });
      } else if (error.code === "auth/invalid-email") {
        title = t("onboarding.errorInvalidMailAdressTitle");
        message = t("onboarding.errorInvalidMailAdressMsg");
      }

      Alert.alert(title, message, [{ text: t("common.ok") }]);
    }
  };

  const handleBack = () => {
    dispatch({ type: "RESET" });
  };

  const renderContent = () => {
    if (state.activeType === null) {
      return (
        <EmailInputScreen
          email={state.email}
          onEmailChange={(email) =>
            dispatch({ type: "SET_EMAIL", payload: email })
          }
          onSubmit={handleEmailSubmit}
          processing={state.processing}
        />
      );
    }

    if (state.activeType === "LOGIN") {
      return (
        <LoginScreen
          email={state.email}
          password={state.password}
          onPasswordChange={(password) =>
            dispatch({ type: "SET_PASSWORD", payload: password })
          }
          onLogin={handleLogin}
          onBack={handleBack}
          onResetPassword={handleResetPassword}
          processing={state.processing}
        />
      );
    }

    return (
      <RegistrationScreen
        email={state.email}
        password={state.password}
        passwordConfirm={state.passwordConfirm}
        acceptedPrivacy={state.acceptedPrivacy}
        acceptedAnalytics={state.acceptedAnalytics}
        passwordError={state.passwordError}
        onPasswordChange={(password) =>
          dispatch({ type: "SET_PASSWORD", payload: password })
        }
        onPasswordConfirmChange={(password) =>
          dispatch({ type: "SET_PASSWORD_CONFIRM", payload: password })
        }
        onPrivacyToggle={() => dispatch({ type: "TOGGLE_PRIVACY" })}
        onAnalyticsToggle={() => dispatch({ type: "TOGGLE_ANALYTICS" })}
        onRegister={handleRegister}
        onBack={handleBack}
        processing={state.processing}
      />
    );
  };

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
