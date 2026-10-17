import { CheckBox } from "@/common/CheckBox";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";
import { Trans, useTranslation } from "react-i18next";

type Props = {
  checked: boolean;
  showError?: boolean;
  onCheck: (checked: boolean) => void;
  onPrivacyPress: () => void;
  onAgbPress: () => void;
  label: "ANONYMISED_DATA_USE" | "PRIVACY_SIMPLE" | "PRIVACY_FULL";
};

/**
 * PrivacyCheckbox Component
 *
 * Renders a checkbox with privacy/AGB text and tappable links
 */
const ELEMENT_SIZE = 48;

const PrivacyCheckboxText: FC<
  Pick<Props, "label" | "onPrivacyPress" | "onAgbPress">
> = ({ label, onPrivacyPress, onAgbPress }) => {
  const { t } = useTranslation();

  if (label === "ANONYMISED_DATA_USE") {
    return (
      <Text color="darkGrey2" fontSize={14}>
        {t("onboarding.anonymisedDataUse")}
      </Text>
    );
  }

  const privacyComponents = {
    agb: <Text textDecorationLine="underline" onPress={onAgbPress} />,
    privacy: <Text textDecorationLine="underline" onPress={onPrivacyPress} />,
    info: <Text textDecorationLine="underline" onPress={onPrivacyPress} />,
  };

  return (
    <Text color="darkGrey2" fontSize={14}>
      <Trans
        i18nKey={
          label === "PRIVACY_FULL"
            ? "onboarding.privacyFull"
            : "onboarding.privacySimple"
        }
        components={privacyComponents}
      />
    </Text>
  );
};

export const PrivacyCheckbox: FC<Props> = ({
  checked,
  showError,
  onCheck,
  onPrivacyPress,
  onAgbPress,
  label,
}) => {
  const { t } = useTranslation();

  const checkboxLabels = {
    ANONYMISED_DATA_USE: t("onboarding.checkboxAnonymisedDataUse"),
    PRIVACY_FULL: t("onboarding.checkboxPrivacyFull"),
    PRIVACY_SIMPLE: t("onboarding.checkboxPrivacySimple"),
  };

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
        <CheckBox
          checked={checked}
          changed={onCheck}
          accessibilityLabel={checkboxLabels[label]}
        />
      </Box>
      <Box flexShrink={1}>
        <PrivacyCheckboxText
          label={label}
          onPrivacyPress={onPrivacyPress}
          onAgbPress={onAgbPress}
        />
      </Box>
    </Box>
  );
};
