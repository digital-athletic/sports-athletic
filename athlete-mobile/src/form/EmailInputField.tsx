import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Ionicon } from "../common/Ionicon";
import { BasicTextInput } from "./BasicTextInput";

interface EmailInputFieldProps {
  email: string;
  showError?: boolean;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
}

const HEIGHT = 56;

/**
 * Email input field with mail icon
 */
export const EmailInputField: FC<EmailInputFieldProps> = ({
  email,
  showError,
  onChange,
  onFocus,
  onSubmitEditing,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      backgroundColor="lightGrey2"
      borderRadius="m"
      height={HEIGHT}
      borderWidth={showError ? 1 : 0}
      borderColor={showError ? "error" : undefined}
    >
      <Box
        width={HEIGHT}
        height={HEIGHT}
        justifyContent="center"
        alignItems="center"
        backgroundColor="lightGrey1"
        borderTopLeftRadius="m"
        borderBottomLeftRadius="m"
        borderLeftWidth={showError ? 1 : 0}
        borderTopWidth={showError ? 1 : 0}
        borderBottomWidth={showError ? 1 : 0}
        borderColor={showError ? "error" : undefined}
      >
        <Ionicon
          name="mail"
          size={24}
          color={colors.lightGrey3}
          decorative
        />
      </Box>
      <BasicTextInput
        onChangeText={onChange}
        placeholder={t("common.email")}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        inputMode="email"
        value={email}
        onFocus={onFocus}
        onSubmitEditing={onSubmitEditing}
        style={{ height: HEIGHT }}
      />
    </Box>
  );
};
