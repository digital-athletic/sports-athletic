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
import { ContentColumn } from "./ContentColumn";
import { StepProgress } from "./StepProgress";

type Step = { current: number; total: number };

type Action = { label: string; onPress: () => void; disabled?: boolean };

type HeadlineScreenProps = PropsWithChildren<{
  /** Name of the screen for the navigator and the browser tab. */
  title: string;
  heading: string;
  description?: string;
  /** Small text above the heading. A step counter takes its place. */
  eyebrow?: string;
  step?: Step;
  /** Shows the stack header with the back arrow. Defaults to true. */
  headerShown?: boolean;
  onBack?: () => void;
  headerRight?: ReactNode;
  /** Main button, pinned to the bottom. Without it the screen has no footer. */
  action?: Action;
  /** Uses the full window width on a tablet, for content that adapts to it, like a tile grid. */
  wide?: boolean;
}>;

type ColumnProps = PropsWithChildren<{
  wide: boolean;
  testID: string;
  gap?: "xl";
}>;

const Column: FC<ColumnProps> = ({ wide, testID, gap, children }) =>
  wide ? (
    <Box testID={testID} gap={gap}>
      {children}
    </Box>
  ) : (
    <ContentColumn testID={testID} gap={gap}>
      {children}
    </ContentColumn>
  );

const Footer: FC<{ action: Action; wide: boolean }> = ({ action, wide }) => {
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();

  return (
    <Box
      backgroundColor="surface"
      paddingHorizontal="l"
      paddingTop="m"
      borderTopWidth={StyleSheet.hairlineWidth}
      borderTopColor="outlineVariant"
      style={{ paddingBottom: Math.max(insets.bottom, spacing.l) }}
    >
      <Column wide={wide} testID="headline-screen-footer-column">
        <Button
          variant="cta"
          onPress={action.onPress}
          disabled={action.disabled}
        >
          {action.label}
        </Button>
      </Column>
    </Box>
  );
};

/**
 * Screen frame with a quiet header (back arrow, optional step progress), a
 * large headline, the scrolling content and the main button at the bottom.
 */
export const HeadlineScreen: FC<HeadlineScreenProps> = ({
  title,
  heading,
  description,
  eyebrow,
  step,
  headerShown = true,
  onBack,
  headerRight,
  action,
  wide = false,
  children,
}) => {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const eyebrowText = step ? t("common.stepOf", step) : eyebrow;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown,
          title,
          headerTitle: () => (step ? <StepProgress {...step} /> : null),
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
          headerLeft: () => <BackHeader onBack={onBack} />,
          headerRight: () => headerRight,
        }}
      />
      <Box flex={1} backgroundColor="surface">
        <ScrollBox
          flex={1}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.l }}
        >
          <Column wide={wide} testID="headline-screen-column" gap="xl">
            <Box gap="s">
              {eyebrowText ? (
                <Text variant="eyebrow">{eyebrowText}</Text>
              ) : null}
              <Text variant="display" accessibilityRole="header">
                {heading}
              </Text>
              {description && (
                <Text variant="subtitle" color="onSurfaceVariant">
                  {description}
                </Text>
              )}
            </Box>
            {children}
          </Column>
        </ScrollBox>
        {action && <Footer action={action} wide={wide} />}
      </Box>
    </>
  );
};
