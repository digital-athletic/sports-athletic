import { LOGO_SIZE } from "@/constants/AppConstants";
import { DividerWithText } from "@/features/onboarding/DividerWithText";
import { EmailInputField } from "@/form/EmailInputField";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  email: string;
  onEmailChange: (email: string) => void;
  onLogin: () => void;
  onSignup: () => void;
  processing: boolean;
};

/**
 * LoginScreen Component
 *
 * Login screen with email input — sends OTP code for passwordless login
 */
export const LoginScreen: FC<Props> = ({
  email,
  onEmailChange,
  onLogin,
  onSignup,
  processing,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // The register button below has a 1px outline. The same outline in the fill
  // colour keeps both buttons exactly the same size.
  const outlineMatchingStyle = {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  };

  return (
    <Box
      flex={1}
      justifyContent="space-between"
      alignItems="stretch"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Box
        flex={1}
        justifyContent="center"
        alignItems="center"
        paddingVertical="m"
      >
        <Image
          resizeMode="contain"
          style={{ height: LOGO_SIZE, width: LOGO_SIZE, marginTop: 16 }}
          source={require("../../../assets/img/logos/SA_dark.png")}
        />
      </Box>

      <Box flex={4} justifyContent="flex-start" alignItems="center">
        <DividerWithText text={t("onboarding.login")} />

        <Box alignSelf="stretch" paddingHorizontal="m" paddingVertical="s">
          <EmailInputField
            email={email}
            title={t("onboarding.emailLabel")}
            onChange={onEmailChange}
            onSubmitEditing={onLogin}
          />
        </Box>

        <Box alignSelf="stretch" paddingHorizontal="m" paddingVertical="s">
          <Button
            onPress={onLogin}
            variant="primary"
            disabled={processing}
            style={outlineMatchingStyle}
          >
            {processing ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              t("onboarding.sendCode")
            )}
          </Button>
        </Box>

        <Box alignSelf="stretch" paddingHorizontal="m" paddingVertical="s">
          <Button onPress={onSignup} variant="secondary">
            {t("onboarding.register")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
