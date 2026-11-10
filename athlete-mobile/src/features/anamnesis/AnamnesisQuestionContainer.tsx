import { LocalizedDisplayName } from "@/common/types/LocalizedDisplayName";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import React, { type FC, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  title: LocalizedDisplayName;
  description?: LocalizedDisplayName;
};

/**
 * One question of an anamnesis screen: a visible label, an optional hint and
 * the input below.
 */
export const AnamnesisQuestionContainer: FC<PropsWithChildren<Props>> = ({
  title,
  description,
  children,
}) => {
  const { i18n } = useTranslation();

  // Select the appropriate localized text based on current locale
  const getLocalizedText = (text: LocalizedDisplayName): string | undefined => {
    if (text[i18n.language]) {
      return text[i18n.language];
    }
    return text.default;
  };

  return (
    <Box gap="s">
      <Box gap="xs">
        <Text variant="fieldLabel" accessibilityRole="header">
          {getLocalizedText(title)}
        </Text>
        {description && (
          <Text variant="small" color="darkGrey1">
            {getLocalizedText(description)}
          </Text>
        )}
      </Box>
      {children}
    </Box>
  );
};
