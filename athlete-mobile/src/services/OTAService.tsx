import { Alert } from "@/common/Alert";
import { useForegroundEffect } from "@/utils/useForegroundEffect";
import * as Updates from "expo-updates";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { Logger } from "./Logger";

export const useOTAService = () => {
  const { availableUpdate, isUpdateAvailable, isUpdatePending } =
    Updates.useUpdates();

  useEffect(() => {
    if (!isUpdateAvailable || __DEV__ || Platform.OS === "web") {
      return;
    }

    Logger.logEvent("Update is available, fetching...");
    // If an update is available, we can fetch it
    Updates.fetchUpdateAsync()
      .then(() => {
        // Successfully fetched update
        Logger.logEvent("Update fetched successfully");
      })
      .catch((error) => {
        // Handle error fetching update
        Logger.logEvent("Error fetching update:", error);
      });
  }, [isUpdateAvailable]);

  const effectCallback = useCallback(async () => {
    Logger.logEvent("Checking for updates...");

    if (__DEV__ || Platform.OS === "web") return; // Skip in development mode and for web

    try {
      await Updates.checkForUpdateAsync();
    } catch (error) {
      Logger.logEvent("Error checking for update:", error);
    }
  }, []);

  useForegroundEffect(effectCallback);

  useEffect(() => {
    if (availableUpdate && isUpdatePending) {
      Alert.alert("Update available", undefined, [
        {
          text: "Install Now",
          onPress: () => Updates.reloadAsync(),
          style: "default",
        },
      ]);
    }
  }, [isUpdatePending, availableUpdate]);
};
