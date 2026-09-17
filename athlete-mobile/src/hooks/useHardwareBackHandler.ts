import { useEffect } from "react";
import { BackHandler, Platform } from "react-native";

/** Registers a hardware back button handler; a no-op on web, which has no such button. */
export function useHardwareBackHandler(handler: () => boolean) {
  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handler,
    );
    return () => subscription.remove();
  }, [handler]);
}
