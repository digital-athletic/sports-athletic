import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { AppIcon } from "../common/AppIcon";
import { BasicTextInput } from "./BasicTextInput";
import IconMail from "@tabler/icons-react-native/IconMail";

interface EmailInputFieldProps {
  email: string;
  title?: string;
  showError?: boolean;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
}

const HEIGHT = 56;

/**
 * Email input field with mail icon and optional visible label, outlined like
 * the cards of the redesigned screens
 */
export const EmailInputField: FC<EmailInputFieldProps> = ({
  email,
  title,
  showError,
  onChange,
  onFocus,
  onSubmitEditing,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Box>
      {title ? (
        <Text variant="label" marginBottom="xs">
          {title}
        </Text>
      ) : null}
      <Box
        flexDirection="row"
        alignItems="center"
        backgroundColor="white"
        borderRadius="xl"
        height={HEIGHT}
        paddingLeft="m"
        borderWidth={1.5}
        borderColor={showError ? "error" : "lightGrey3"}
      >
        <AppIcon
          icon={IconMail}
          size={22}
          color={colors.darkGrey1}
          decorative
        />
        <BasicTextInput
          onChangeText={onChange}
          placeholder={t("common.email")}
          accessibilityLabel={title}
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
    </Box>
  );
};
