import {
  requestLoginOtp,
  requestRegistrationOtp,
  saveConsentToProfile,
} from "@/services/AuthService";
import { supabase } from "@/services/supabaseClient";
import { featureFlags } from "@/config/featureFlags";
import { useAuthStore } from "@/store/authStore";
import { useUserSettingsStore } from "@/store/userSettingsStore";
import { useRegistrationConsentStore } from "@/store/registrationConsentStore";
import { getErrorCode } from "@/utils/ErrorUtils";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/common/Alert";
import { Keyboard, Pressable, StyleSheet, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackHeader } from "@/common/BackHeader";
import { liveRegionProps, useAnnounce } from "@/common/announce";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

type VerificationMode = "LOGIN" | "REGISTER";

/** Screen shown after OTP request to enter the 6-digit verification code. */
export function EmailVerificationScreen() {
  const { email, mode } = useLocalSearchParams<{
    email: string;
    mode: VerificationMode;
  }>();
  // Consent flags come from the in-memory store (set by the registration screen)
  // so they cannot be forged via URL parameter manipulation.
  const pendingConsent = useRegistrationConsentStore((s) => s.pendingConsent);
  const clearPendingConsent = useRegistrationConsentStore(
    (s) => s.clearPendingConsent,
  );
  const termsConsent = pendingConsent?.termsAccepted ?? false;
  const analyticsConsent = pendingConsent?.analyticsAccepted ?? false;

  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadii } = useTheme();
  const initializeFromSupabase = useAuthStore((s) => s.initializeFromSupabase);
  const acceptConsent = useUserSettingsStore((s) => s.acceptConsent);
  const setAnonymisedDataUse = useUserSettingsStore(
    (s) => s.setAnonymisedDataUse,
  );
  const setConsentStatus = useUserSettingsStore((s) => s.setConsentStatus);
  const insets = useSafeAreaInsets();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  useAnnounce(verificationError);
  useAnnounce(resent ? t("onboarding.emailResent") : null);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    setResent(false);

    const request =
      mode === "REGISTER"
        ? requestRegistrationOtp(email ?? "", analyticsConsent)
        : requestLoginOtp(email ?? "");
    return request
      .then(() => {
        setResent(true);
        startCooldown();
      })
      .catch((error: unknown) => {
        const code = getErrorCode(error);
        const message =
          code === "auth/too-many-requests"
            ? t("onboarding.errorMessageTooManyRequests")
            : t("onboarding.alertAnErrorOccuredTitle");
        Alert.alert(t("onboarding.alertErrorTitle"), message);
      })
      .finally(() => {
        setResending(false);
      });
  };

  const handleVerifyOtp = () => {
    if (verifying || otpCode.length !== OTP_LENGTH) return;
    setVerifying(true);
    setVerificationError(null);

    if (
      featureFlags.isReviewUser(email ?? "") &&
      otpCode === featureFlags.reviewOtp
    ) {
      useAuthStore.getState().setAuth({ userId: "review-user" });
      setConsentStatus("accepted");
      if (mode === "REGISTER") {
        clearPendingConsent();
        router.replace("/anamnesis");
      }
      setVerifying(false);
      return;
    }

    const verify = async () => {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email ?? "",
        token: otpCode,
        type: "email",
      });

      if (error) {
        setOtpCode("");
        setVerificationError(t("onboarding.invalidVerificationCode"));
        return;
      }

      if (data.session) {
        await initializeFromSupabase().catch(() => {
          // Session is valid but local store init failed. The auth listener will recover.
        });
        if (mode === "REGISTER") {
          await saveConsentToProfile({
            privacyAccepted: termsConsent,
            analyticsAccepted: analyticsConsent,
          })
            .then(() => {
              setAnonymisedDataUse(analyticsConsent);
              acceptConsent();
            })
            .catch(() => {
              // Fail closed: without a server consent record we must not grant access.
              // The consent gate (Stack.Protected) will intercept the navigation below
              // and route the user to ConsentScreen where they can retry.
              setConsentStatus("missing");
            })
            .finally(() => {
              clearPendingConsent();
            });
          router.replace("/anamnesis");
        }
      } else {
        setVerificationError(t("onboarding.alertAnErrorOccuredTitle"));
      }
    };

    return verify().finally(() => {
      setVerifying(false);
    });
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      <Box
        flex={1}
        backgroundColor="white"
        paddingHorizontal="l"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Box paddingVertical="s">
          <BackHeader onBack={() => router.replace("/onboarding")} />
        </Box>

        <Box flex={1} justifyContent="center" alignItems="center">
          <Text variant="title" textAlign="center" marginBottom="m">
            {t("onboarding.confirmEmailAddressTitle")}
          </Text>

          <Text variant="body" textAlign="center" marginBottom="s">
            {t("onboarding.confirmEmailAddressMessage")}
          </Text>

          <Text
            variant="body"
            textAlign="center"
            marginBottom="l"
            color="primary"
          >
            {email}
          </Text>

          <Text variant="label" textAlign="center" marginBottom="xs">
            {t("onboarding.verificationCodeInput")}
          </Text>
          <Text variant="body" textAlign="center" marginBottom="s">
            {t("onboarding.enterVerificationCode")}
          </Text>

          <TextInput
            value={otpCode}
            onChangeText={(text) => {
              setOtpCode(text.replace(/[^0-9]/g, ""));
              if (verificationError) setVerificationError(null);
            }}
            maxLength={OTP_LENGTH}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoCorrect={false}
            spellCheck={false}
            placeholder="_ _ _ _ _ _"
            placeholderTextColor={colors.darkGrey2}
            accessibilityLabel={t("onboarding.verificationCodeInput")}
            style={[
              styles.otpInput,
              {
                color: colors.darkGrey3,
                backgroundColor: colors.lightGrey2,
                borderColor: verificationError
                  ? colors.error
                  : colors.lightGrey2,
                borderRadius: borderRadii.m,
                padding: spacing.m,
              },
            ]}
          />

          {verificationError && (
            <Text
              variant="description"
              textAlign="center"
              marginBottom="s"
              color="error"
              accessibilityRole="alert"
              {...liveRegionProps}
            >
              {verificationError}
            </Text>
          )}

          <Button
            onPress={handleVerifyOtp}
            disabled={verifying || otpCode.length !== OTP_LENGTH}
            marginBottom="m"
            accessibilityRole="button"
          >
            {t("onboarding.verifyCode")}
          </Button>

          {resent && (
            <Text
              variant="description"
              textAlign="center"
              marginBottom="m"
              color="successText"
              {...liveRegionProps}
            >
              {t("onboarding.emailResent")}
            </Text>
          )}

          <Button
            variant="secondary"
            onPress={handleResend}
            disabled={resending || cooldown > 0}
            marginBottom="m"
            accessibilityRole="button"
          >
            {cooldown > 0
              ? `${t("onboarding.resendEmail")} (${cooldown}s)`
              : t("onboarding.resendEmail")}
          </Button>
        </Box>
      </Box>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  otpInput: {
    width: "100%",
    fontSize: 24,
    letterSpacing: 12,
    textAlign: "center",
    borderWidth: 1,
    marginBottom: 15,
  },
});
