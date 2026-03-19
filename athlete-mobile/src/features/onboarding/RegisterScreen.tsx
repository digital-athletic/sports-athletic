import { featureFlags } from "@/config/featureFlags";
import { LINK_AGB, LINK_PRIVACY } from "@/constants/AppConstants";
import { DividerWithText } from "@/features/onboarding/DividerWithText";
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
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ErrorField = "email" | "privacy";

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
 * RegistrationScreen Component
 *
 * Registration screen with email input and privacy checkboxes (passwordless OTP)
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
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handlePrivacyPress = () => {
    router.push(`/onboarding/webview?url=${encodeURIComponent(LINK_PRIVACY)}`);
  };

  const handleAgbPress = () => {
    router.push(`/onboarding/webview?url=${encodeURIComponent(LINK_AGB)}`);
  };

  return (
    <Box
      flex={4}
      justifyContent="flex-start"
      alignItems="stretch"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <DividerWithText text={t("onboarding.registration")} />

      <ScrollBox
        width="100%"
        flexGrow={1}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <Box alignSelf="stretch" paddingHorizontal="m" paddingVertical="s">
          <EmailInputField
            email={email}
            onChange={onEmailChange}
            showError={errorFields.includes("email")}
          />
        </Box>

        {featureFlags.healthInfoEnabled && (
          <PrivacyCheckbox
            checked={acceptedAnalytics}
            onCheck={onAnalyticsToggle}
            onPrivacyPress={handlePrivacyPress}
            onAgbPress={handleAgbPress}
            label="ANONYMISED_DATA_USE"
          />
        )}

        {featureFlags.termsEnabled && (
          <PrivacyCheckbox
            checked={acceptedPrivacy}
            showError={errorFields.includes("privacy")}
            onCheck={onPrivacyToggle}
            onPrivacyPress={handlePrivacyPress}
            onAgbPress={handleAgbPress}
            label="PRIVACY_INFORMATION_1"
          />
        )}
      </ScrollBox>

      {registrationError && (
        <Box paddingHorizontal="m" paddingVertical="xs">
          <Text variant="description" color="error" accessibilityRole="alert">
            {registrationError}
          </Text>
        </Box>
      )}

      <Box alignSelf="stretch" paddingHorizontal="m" paddingVertical="s">
        <Button onPress={onRegister} variant="primary" disabled={processing}>
          {processing ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            t("onboarding.buttonRegister")
          )}
        </Button>
      </Box>

      <Box
        alignSelf="center"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        height={40}
        paddingHorizontal="m"
      >
        <TouchableOpacity onPress={onBack}>
          <Text variant="button" color="black">
            {t("onboarding.back")}
          </Text>
        </TouchableOpacity>
      </Box>
    </Box>
  );
};
