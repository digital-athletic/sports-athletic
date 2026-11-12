import { OnboardingHeadline } from "@/features/onboarding/OnboardingHeadline";
import { EmailInputField } from "@/form/EmailInputField";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOGO_SIZE = 72;

type Props = {
  email: string;
  onEmailChange: (email: string) => void;
  onLogin: () => void;
  onSignup: () => void;
  processing: boolean;
};

/**
 * Login screen of the passwordless login: the athlete enters an email address
 * and gets a code by email. The footer leads athletes without an account to
 * the registration.
 */
export const LoginScreen: FC<Props> = ({
  email,
  onEmailChange,
  onLogin,
  onSignup,
  processing,
}) => {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Box flex={1} backgroundColor="surface" style={{ paddingTop: insets.top }}>
      <ScrollBox
        flex={1}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.l, gap: spacing.xl }}
      >
        <Image
          resizeMode="contain"
          style={{ height: LOGO_SIZE, width: LOGO_SIZE }}
          source={require("../../../assets/img/logos/SA_dark.png")}
        />

        <OnboardingHeadline
          eyebrow={t("onboarding.loginEyebrow")}
          heading={t("onboarding.loginHeading")}
          description={t("onboarding.loginDescription")}
        />

        <Box gap="m">
          <EmailInputField
            email={email}
            title={t("onboarding.emailLabel")}
            onChange={onEmailChange}
            onSubmitEditing={onLogin}
          />
          <Button onPress={onLogin} variant="cta" disabled={processing}>
            {processing ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              t("onboarding.sendCode")
            )}
          </Button>
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
        <Text variant="small" color="onSurfaceVariant" textAlign="center">
          {t("onboarding.noAccountYet")}
        </Text>
        <Button onPress={onSignup} variant="ctaOutline">
          {t("onboarding.register")}
        </Button>
      </Box>
    </Box>
  );
};
