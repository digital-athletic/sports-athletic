import { DividerWithText } from "@/features/onboarding/DividerWithText";
import { EmailInputField } from "@/form/EmailInputField";
import { PasswordInputField } from "@/form/PasswordInputField";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  email: string;
  password: string;
  onPasswordChange: (password: string) => void;
  onLogin: () => void;
  onBack: () => void;
  onResetPassword: () => void;
  processing: boolean;
};

/**
 * LoginScreen Component
 *
 * Login screen with password input and reset password link
 * Migrated from legacy/views/onboarding/Onboarding.js renderLogin
 */
export const LoginScreen: FC<Props> = ({
  email,
  password,
  onPasswordChange,
  onLogin,
  onBack,
  onResetPassword,
  processing,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleResetPassword = () => {
    Alert.alert(
      t("onboarding.loginSureToResetPasswordTitle"),
      t("onboarding.loginSureToResetPasswordMessage", { email }),
      [
        {
          text: t("onboarding.yesCaps"),
          onPress: onResetPassword,
        },
        {
          text: t("onboarding.noCaps"),
        },
      ]
    );
  };

  return (
    <Box
      flex={4}
      justifyContent="flex-start"
      alignItems="center"
      style={{ paddingTop: 200, paddingBottom: insets.bottom }}
    >
      <DividerWithText text={t("onboarding.login")} />

      <Box alignSelf="stretch" paddingHorizontal="m" paddingVertical="s">
        <EmailInputField email={email} onChange={() => {}} />
      </Box>

      <Box alignSelf="stretch" paddingHorizontal="m" paddingVertical="s">
        <PasswordInputField
          password={password}
          onChange={onPasswordChange}
          showError={false}
          onSubmitEditing={onLogin}
        />
      </Box>

      <Box alignSelf="stretch" paddingHorizontal="m" paddingVertical="s">
        <Button onPress={onLogin} variant="primary" disabled={processing}>
          {processing ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            t("onboarding.login")
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

      <Box
        alignSelf="center"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        height={32}
        paddingHorizontal="m"
      >
        <TouchableOpacity onPress={handleResetPassword}>
          <Text variant="body" color="darkGrey2">
            {t("onboarding.resetPassword")}
          </Text>
        </TouchableOpacity>
      </Box>
    </Box>
  );
};
