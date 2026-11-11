import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";

/**
 * Registers a hardware back button handler while the screen is focused, so a
 * screen below in the stack does not catch the press; a no-op on web.
 */
export function useFocusedHardwareBackHandler(handler: () => boolean) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handler,
      );
      return () => subscription.remove();
    }, [handler]),
  );
}
