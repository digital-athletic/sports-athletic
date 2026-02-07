import { CheckBox } from "@/common/CheckBox";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

type Props = {
  checked: boolean;
  showError?: boolean;
  onCheck: (checked: boolean) => void;
  onPrivacyPress: () => void;
  onAgbPress: () => void;
  label:
    | "ANONYMISED_DATA_USE"
    | "PRIVACY_INFORMATION_1"
    | "PRIVACY_INFORMATION_2"
    | "PRIVACY_INFORMATION_3";
};

/**
 * PrivacyCheckbox Component
 *
 * Renders a checkbox with privacy/AGB text and tappable links
 * Migrated from legacy/views/onboarding/Onboarding.js
 */
const ELEMENT_SIZE = 48;

export const PrivacyCheckbox: FC<Props> = ({
  checked,
  showError,
  onCheck,
  onPrivacyPress,
  onAgbPress,
  label,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      alignSelf="stretch"
      paddingHorizontal="m"
      paddingVertical="s"
      flexDirection="row"
      alignItems="center"
      gap="m"
      borderWidth={showError ? 1 : 0}
      borderColor={showError ? "error" : undefined}
      borderRadius="m"
      style={{
        minHeight: ELEMENT_SIZE,
      }}
    >
      <Box
        alignItems="center"
        justifyContent="center"
        style={{
          height: ELEMENT_SIZE - 2,
          width: ELEMENT_SIZE - 2,
        }}
      >
        <CheckBox checked={checked} changed={onCheck} />
      </Box>
      <Box flexShrink={1}>
        {label === "ANONYMISED_DATA_USE" ? (
          <Text color="darkGrey2" fontSize={14}>
            {t("onboarding.anonymisedDataUse")}
          </Text>
        ) : (
          <TouchableOpacity onPress={onPrivacyPress}>
            <Text color="darkGrey2" fontSize={14}>
              <Text>{t("onboarding.privacyInformation1")}</Text>
              <Text textDecorationLine="underline" onPress={onAgbPress}>
                {t("onboarding.agbLink")}
              </Text>
              <Text>{t("onboarding.privacyInformation2")}</Text>
              <Text textDecorationLine="underline" onPress={onPrivacyPress}>
                {t("onboarding.privacyLink")}
              </Text>
              <Text>{t("onboarding.privacyInformation3")}</Text>
              <Text textDecorationLine="underline" onPress={onPrivacyPress}>
                {t("onboarding.moreInformation")}
              </Text>
            </Text>
          </TouchableOpacity>
        )}
      </Box>
    </Box>
  );
};
