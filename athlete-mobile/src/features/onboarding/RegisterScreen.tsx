import { BackHeader } from "@/common/BackHeader";
import { liveRegionProps, useAnnounce } from "@/common/announce";
import { featureFlags } from "@/config/featureFlags";
import { LINK_AGB, LINK_PRIVACY } from "@/constants/AppConstants";
import { OnboardingHeadline } from "@/features/onboarding/OnboardingHeadline";
import { PrivacyCheckbox } from "@/features/onboarding/PrivacyCheckbox";
import { EmailInputField } from "@/form/EmailInputField";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { useRouter } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ErrorField = "email" | "privacy" | "analytics";

type Props = {
  email: string;
  acceptedPrivacy: boolean;
  acceptedAnalytics: boolean;
  registrationError: string | null;
  errorFields: ErrorField[];
  onEmailChange: (email: string) => void;
  onPrivacyToggle: (accepted: boolean) => void;
  onAnalyticsToggle: (accepted: boolean) => void;
  onRegister: () => void;
  onBack: () => void;
  processing: boolean;
};

/**
 * Registration screen of the passwordless registration: the athlete enters an
 * email address and agrees to the terms, then gets a code by email.
 */
export const RegistrationScreen: FC<Props> = ({
  email,
  acceptedPrivacy,
  acceptedAnalytics,
  registrationError,
  errorFields,
  onEmailChange,
  onPrivacyToggle,
  onAnalyticsToggle,
  onRegister,
  onBack,
  processing,
}) => {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useAnnounce(registrationError);

  const handlePrivacyPress = () => {
    router.push(`/onboarding/webview?url=${encodeURIComponent(LINK_PRIVACY)}`);
  };

  const handleAgbPress = () => {
    router.push(`/onboarding/webview?url=${encodeURIComponent(LINK_AGB)}`);
  };

  return (
    <Box flex={1} backgroundColor="surface" style={{ paddingTop: insets.top }}>
      <Box paddingHorizontal="l" paddingVertical="s" alignItems="flex-start">
        <BackHeader onBack={onBack} />
      </Box>

      <ScrollBox
        flex={1}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingVertical: spacing.l,
          gap: spacing.xl,
        }}
      >
        <Box paddingHorizontal="l" gap="xl">
          <OnboardingHeadline
            eyebrow={t("onboarding.registration")}
            heading={t("onboarding.registerHeading")}
            description={t("onboarding.registerDescription")}
          />
          <EmailInputField
            email={email}
            title={t("onboarding.emailLabel")}
            onChange={onEmailChange}
            showError={errorFields.includes("email")}
          />
        </Box>

        {/* The checkboxes bring their own padding for the error outline. */}
        <Box paddingHorizontal="xs" gap="xs">
          {featureFlags.privacyEnabled && (
            <PrivacyCheckbox
              checked={acceptedPrivacy}
              showError={errorFields.includes("privacy")}
              onCheck={onPrivacyToggle}
              onPrivacyPress={handlePrivacyPress}
              onAgbPress={handleAgbPress}
              label={
                featureFlags.termsEnabled ? "PRIVACY_FULL" : "PRIVACY_SIMPLE"
              }
            />
          )}

          {featureFlags.analyticsConsentEnabled && (
            <PrivacyCheckbox
              checked={acceptedAnalytics}
              showError={errorFields.includes("analytics")}
              onCheck={onAnalyticsToggle}
              onPrivacyPress={handlePrivacyPress}
              onAgbPress={handleAgbPress}
              label="ANONYMISED_DATA_USE"
            />
          )}
        </Box>
      </ScrollBox>

      <Box
        gap="s"
        paddingHorizontal="l"
        paddingTop="m"
        borderTopWidth={StyleSheet.hairlineWidth}
        borderTopColor="outlineVariant"
        style={{ paddingBottom: Math.max(insets.bottom, spacing.l) }}
      >
        {registrationError && (
          <Text
            variant="small"
            color="error"
            accessibilityRole="alert"
            {...liveRegionProps}
          >
            {registrationError}
          </Text>
        )}
        <Button onPress={onRegister} variant="cta" disabled={processing}>
          {processing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            t("onboarding.buttonRegister")
          )}
        </Button>
      </Box>
    </Box>
  );
};
