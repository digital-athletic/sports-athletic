import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkState } from "@/hooks/useNetworkState";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";

/** Shows an absolute-positioned warning banner at the top of the screen when the device is offline. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useNetworkState();
  const insets = useSafeAreaInsets();

  if (isOnline) {
    return null;
  }

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      style={{ paddingTop: insets.top }}
      backgroundColor="warning"
      paddingVertical="s"
      paddingHorizontal="m"
      zIndex={999 as never}
    >
      <Text color="white" textAlign="center" variant="small">
        {t("common.offline")}
      </Text>
    </Box>
  );
}
