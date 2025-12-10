import type { LocalizedText } from "@/store/anamnesisStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import React, { type FC, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  title: LocalizedText;
  description?: LocalizedText;
};

/**
 * Container component for anamnesis questionnaire sections.
 * Displays a title, optional description, and children with consistent padding.
 */
export const AnamnesisQuestionContainer: FC<PropsWithChildren<Props>> = ({
  title,
  description,
  children,
}) => {
  const { i18n } = useTranslation();

  // Select the appropriate localized text based on current locale
  const getLocalizedText = (text: LocalizedText): string => {
    if (text[i18n.language]) {
      return text[i18n.language];
    }
    return text.default;
  };

  return (
    <Box paddingHorizontal="m" paddingVertical="s">
      <Box marginBottom="xs">
        <Text variant="title">{getLocalizedText(title)}</Text>
      </Box>
      {description && (
        <Box marginBottom="s">
          <Text variant="body">{getLocalizedText(description)}</Text>
        </Box>
      )}
      {children}
    </Box>
  );
};
