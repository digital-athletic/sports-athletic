import { LOGO_SIZE } from "@/constants/AppConstants";
import { DividerWithText } from "@/features/onboarding/DividerWithText";
import { EmailInputField } from "@/form/EmailInputField";
import { PasswordInputField } from "@/form/PasswordInputField";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  email: string;
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onLogin: () => void;
  onSignup: () => void;
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
  onEmailChange,
  onPasswordChange,
  onLogin,
  onSignup,
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
      ],
    );
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
          <EmailInputField email={email} onChange={onEmailChange} />
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
          height={32}
          paddingHorizontal="m"
        >
          <TouchableOpacity onPress={handleResetPassword}>
            <Text variant="body" color="darkGrey2">
              {t("onboarding.resetPassword")}
            </Text>
          </TouchableOpacity>
        </Box>

        <Box
          alignSelf="center"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          height={40}
          paddingHorizontal="m"
          marginTop="m"
        >
          <Text variant="body" color="darkGrey2">
            {t("onboarding.noAccountYet")}{" "}
          </Text>
          <TouchableOpacity onPress={onSignup}>
            <Text variant="button" color="primary">
              {t("onboarding.register")}
            </Text>
          </TouchableOpacity>
        </Box>
      </Box>
    </Box>
  );
};
