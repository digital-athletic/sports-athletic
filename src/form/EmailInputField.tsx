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
  onSubmitEditing?: () => void;
}

const HEIGHT = 56;

/**
 * Email input field with mail icon
 */
export const EmailInputField: FC<EmailInputFieldProps> = ({
  email,
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
    >
      <Box
        width={HEIGHT}
        height={HEIGHT}
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
        onSubmitEditing={onSubmitEditing}
        style={{ height: HEIGHT }}
      />
    </Box>
  );
};
