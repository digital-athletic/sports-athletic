import { saveConsentToProfile } from "@/services/AuthService";
import { featureFlags } from "@/config/featureFlags";
import { LINK_AGB, LINK_PRIVACY } from "@/constants/AppConstants";
import { useAuthStore } from "@/store/authStore";
import { useUserSettingsStore } from "@/store/userSettingsStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrivacyCheckbox } from "./PrivacyCheckbox";

/** Blocking consent screen shown to pre-registration users who have not yet accepted privacy policy. */
export function ConsentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [analyticsAccepted, setAnalyticsAccepted] = useState(false);
  const [showPrivacyError, setShowPrivacyError] = useState(false);
  const [showAnalyticsError, setShowAnalyticsError] = useState(false);
  const [showSaveError, setShowSaveError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const auth = useAuthStore((state) => state.auth);
  const setConsentStatus = useUserSettingsStore(
    (state) => state.setConsentStatus,
  );
  const setAnonymisedDataUse = useUserSettingsStore(
    (state) => state.setAnonymisedDataUse,
  );

  const handlePrivacyPress = () => {
    if (LINK_PRIVACY) {
      router.push(`/webview?url=${encodeURIComponent(LINK_PRIVACY)}`);
    }
  };

  const handleAgbPress = () => {
    if (LINK_AGB) {
      router.push(`/webview?url=${encodeURIComponent(LINK_AGB)}`);
    }
  };

  const handleAccept = async () => {
    if (!privacyAccepted) {
      setShowPrivacyError(true);
      return;
    }
    if (featureFlags.analyticsConsentEnabled && !analyticsAccepted) {
      setShowAnalyticsError(true);
      return;
    }
    if (!auth) return;

    setShowSaveError(false);
    setSubmitting(true);
    try {
      await saveConsentToProfile(auth.userId, {
        privacyAccepted: true,
        analytics: analyticsAccepted,
      });
      setAnonymisedDataUse(analyticsAccepted);
      setConsentStatus("accepted");
    } catch {
      setShowSaveError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const privacyLabel = featureFlags.termsEnabled
    ? "PRIVACY_FULL"
    : "PRIVACY_SIMPLE";

  return (
    <Box
      flex={1}
      backgroundColor="white"
      paddingHorizontal="l"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text variant="title" textAlign="center" marginBottom="m">
          {t("onboarding.consentTitle")}
        </Text>

        <Text variant="body" textAlign="center" marginBottom="xl">
          {t("onboarding.consentSubtitle")}
        </Text>

        <PrivacyCheckbox
          checked={privacyAccepted}
          showError={showPrivacyError}
          onCheck={(checked) => {
            setPrivacyAccepted(checked);
            if (checked) setShowPrivacyError(false);
          }}
          onPrivacyPress={handlePrivacyPress}
          onAgbPress={handleAgbPress}
          label={privacyLabel}
        />

        {showPrivacyError && (
          <Text
            variant="description"
            color="error"
            textAlign="center"
            marginTop="s"
            accessibilityRole="alert"
          >
            {t("onboarding.errorMessageAcceptPrivacyInfo")}
          </Text>
        )}

        {featureFlags.analyticsConsentEnabled && (
          <PrivacyCheckbox
            checked={analyticsAccepted}
            showError={showAnalyticsError}
            onCheck={(checked) => {
              setAnalyticsAccepted(checked);
              if (checked) setShowAnalyticsError(false);
            }}
            onPrivacyPress={handlePrivacyPress}
            onAgbPress={handleAgbPress}
            label="ANONYMISED_DATA_USE"
          />
        )}

        {showAnalyticsError && (
          <Text
            variant="description"
            color="error"
            textAlign="center"
            marginTop="s"
            accessibilityRole="alert"
          >
            {t("onboarding.errorMessageAcceptAnalytics")}
          </Text>
        )}

        {showSaveError && (
          <Text
            variant="description"
            color="error"
            textAlign="center"
            marginTop="s"
            accessibilityRole="alert"
          >
            {t("onboarding.errorMessageConsentSaveFailed")}
          </Text>
        )}

        <Button
          onPress={handleAccept}
          disabled={submitting}
          marginTop="l"
          accessibilityRole="button"
        >
          {t("onboarding.consentAccept")}
        </Button>
      </Box>
    </Box>
  );
}
