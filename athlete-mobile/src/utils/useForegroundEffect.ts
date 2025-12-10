import { useEffect } from "react";
import { AppState } from "react-native";

export const useForegroundEffect = (callback: () => void) => {
  useEffect(() => {
    // Call the callback on mount
    callback();

    // Listener for app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        callback();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    // Cleanup the listener on unmount
    return () => {
      subscription.remove();
    };
  }, [callback]);
};
