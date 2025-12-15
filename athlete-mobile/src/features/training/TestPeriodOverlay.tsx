import { getTestPeriodDaysLeft } from "@/features/subscription/subscriptionHelpers";
import { useSubscriptionStore } from "@/features/subscription/subscriptionStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

type TestPeriodOverlayProps = {
  goToSubscribe: () => void;
};

/**
 * Displays test period countdown overlay on Android when user is in trial period.
 * Only shows on Android and only if not subscribed and days remaining >= 0.
 */
export function TestPeriodOverlay({ goToSubscribe }: TestPeriodOverlayProps) {
  const { t } = useTranslation();
  const { isSubscribed, firstRegistration } = useSubscriptionStore(
    (state) => state.subscription,
  );

  const daysLeft = getTestPeriodDaysLeft(firstRegistration);

  // Only show on Android and when user is in trial period
  if (Platform.OS === "ios" || isSubscribed || daysLeft < 0) {
    return null;
  }

  const text =
    daysLeft < 2
      ? t("more.testPeriodExpired")
      : t("more.stillXDaysForFree", { count: daysLeft });

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      padding="s"
      justifyContent="center"
      alignItems="center"
    >
      <TouchableBox
        paddingVertical="s"
        paddingHorizontal="m"
        borderRadius="m"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        onPress={goToSubscribe}
        accessibilityRole="button"
        accessibilityLabel={t("more.stillXDaysForFree", { count: daysLeft })}
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <Text variant="body" color="white" textAlign="center">
          {text}
        </Text>
      </TouchableBox>
    </Box>
  );
}
