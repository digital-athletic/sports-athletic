import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";

type Props = {
  eyebrow: string;
  heading: string;
  description: string;
};

/**
 * Headline block of the login, registration and code screens: a small
 * uppercase line, the large headline and one explaining line.
 */
export const OnboardingHeadline: FC<Props> = ({
  eyebrow,
  heading,
  description,
}) => (
  <Box gap="s">
    <Text variant="eyebrow">{eyebrow}</Text>
    <Text variant="display" accessibilityRole="header">
      {heading}
    </Text>
    <Text variant="subtitle" color="darkGrey1">
      {description}
    </Text>
  </Box>
);
