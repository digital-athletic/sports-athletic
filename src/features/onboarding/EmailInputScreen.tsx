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
  onSubmit: () => void;
  processing: boolean;
};

/**
 * EmailInputScreen Component
 *
 * Initial onboarding screen with logo, email input, and continue button
 * Migrated from legacy/views/onboarding/Onboarding.js renderMailInput
 */
export const EmailInputScreen: FC<Props> = ({
  email,
  onEmailChange,
  onSubmit,
  processing,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
        <DividerWithText text={t("onboarding.loginOrRegisterForFree")} />

        <Box alignSelf="stretch" paddingHorizontal="m" paddingVertical="s">
          <EmailInputField
            email={email}
            onChange={onEmailChange}
            onSubmitEditing={onSubmit}
          />
        </Box>

        <Box alignSelf="stretch" paddingHorizontal="m" paddingVertical="s">
          <Button onPress={onSubmit} variant="primary" disabled={processing}>
            {processing ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              t("onboarding.continue")
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
