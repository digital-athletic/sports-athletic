import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Ionicon } from "../common/Ionicon";
import { BasicTextInput } from "./BasicTextInput";

interface EmailInputFieldProps {
  email: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
}

/**
 * Email input field with mail icon
 */
export const EmailInputField: FC<EmailInputFieldProps> = ({
  email,
  onChange,
  onFocus,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      backgroundColor="lightGrey2"
      borderRadius="m"
      height={56}
    >
      <Box
        width={56}
        height={56}
        justifyContent="center"
        alignItems="center"
        backgroundColor="lightGrey1"
        borderTopLeftRadius="m"
        borderBottomLeftRadius="m"
      >
        <Ionicon
          name="mail"
          size={24}
          color={colors.lightGrey3}
          accessibilityLabel="email-icon"
        />
      </Box>
      <BasicTextInput
        onChangeText={onChange}
        placeholder={t("common.email")}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onFocus={onFocus}
      />
    </Box>
  );
};
