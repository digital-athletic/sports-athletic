import { BackHeader } from "@/common/BackHeader";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Stack } from "expo-router";
import { type FC, type PropsWithChildren, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StepProgress } from "./StepProgress";

type Step = { current: number; total: number };

type Action = { label: string; onPress: () => void; disabled?: boolean };

type AnamnesisScreenProps = PropsWithChildren<{
  /** Name of the screen for the navigator and the browser tab. */
  title: string;
  heading: string;
  description?: string;
  step?: Step;
  onBack?: () => void;
  headerRight?: ReactNode;
  /** Main button, pinned to the bottom. Without it the screen has no footer. */
  action?: Action;
}>;

const Footer: FC<{ action: Action }> = ({ action }) => {
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();

  return (
    <Box
      backgroundColor="white"
      paddingHorizontal="l"
      paddingTop="m"
      borderTopWidth={StyleSheet.hairlineWidth}
      borderTopColor="lightGrey2"
      style={{ paddingBottom: Math.max(insets.bottom, spacing.l) }}
    >
      <Button variant="cta" onPress={action.onPress} disabled={action.disabled}>
        {action.label}
      </Button>
    </Box>
  );
};

/**
 * Frame of every anamnesis step: a quiet header with the step progress, a
 * large headline, the scrolling questions and the main button at the bottom.
 */
export const AnamnesisScreen: FC<AnamnesisScreenProps> = ({
  title,
  heading,
  description,
  step,
  onBack,
  headerRight,
  action,
  children,
}) => {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          headerTitle: () => (step ? <StepProgress {...step} /> : null),
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.white },
          headerLeft: () => <BackHeader onBack={onBack} />,
          headerRight: () => headerRight,
        }}
      />
      <Box flex={1} backgroundColor="white">
        <ScrollBox
          flex={1}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.l, gap: spacing.xl }}
        >
          <Box gap="s">
            {step && <Text variant="eyebrow">{t("common.stepOf", step)}</Text>}
            <Text variant="display" accessibilityRole="header">
              {heading}
            </Text>
            {description && (
              <Text variant="subtitle" color="darkGrey1">
                {description}
              </Text>
            )}
          </Box>
          {children}
        </ScrollBox>
        {action && <Footer action={action} />}
      </Box>
    </>
  );
};
