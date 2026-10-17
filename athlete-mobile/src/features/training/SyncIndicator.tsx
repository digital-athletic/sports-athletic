import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@shopify/restyle";
import { useEffect, useRef, type FC } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet } from "react-native";
import { useSynchronizationStore } from "./synchronizationStore";

/**
 * Overlay component that displays training data synchronization progress.
 * Shows loading bar, success, or error states during async operations.
 */
export const SyncIndicator: FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { synchronization, resetSynchronization, stopSynchronization } =
    useSynchronizationStore();

  // Animate progress bar
  useEffect(() => {
    if (!synchronization.updating || !synchronization.isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const startTime = synchronization.start;
    let currentProgress = 0;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;

      // Timeout after 22 seconds
      if (elapsed > 22) {
        stopSynchronization(false, true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      // Progressive animation based on elapsed time
      const progressIntervalCount = currentProgress / 20 + 1;
      if (elapsed > progressIntervalCount * 1.5 && currentProgress < 80) {
        currentProgress += 20;
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    synchronization.updating,
    synchronization.isVisible,
    synchronization.start,
    stopSynchronization,
  ]);

  // Show alert on failure
  useEffect(() => {
    if (synchronization.failed && synchronization.isVisible) {
      Alert.alert(
        t("training.active.syncIndicator.failedTitle"),
        t("training.active.syncIndicator.failedMessage"),
        [
          {
            text: t("common.yes"),
            onPress: () => {},
          },
        ],
      );
    }
  }, [synchronization.failed, synchronization.isVisible, t]);

  // Auto-reset after completion
  useEffect(() => {
    if (
      synchronization.isVisible &&
      !synchronization.updating &&
      (synchronization.finished || synchronization.failed)
    ) {
      const timeout = setTimeout(() => {
        resetSynchronization();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [
    synchronization.isVisible,
    synchronization.updating,
    synchronization.finished,
    synchronization.failed,
    resetSynchronization,
  ]);

  if (!synchronization.isVisible) {
    return null;
  }

  const statusColor = synchronization.failed
    ? theme.colors.primary
    : theme.colors.success;

  const displayText = synchronization.failed
    ? t("training.active.syncIndicator.failed")
    : synchronization.finished
      ? t("training.active.syncIndicator.synchronized")
      : t("training.active.syncIndicator.synchronizing");

  const progressPercent = synchronization.updating ? 50 : 100;

  return (
    <Box style={styles.overlayContainer}>
      <Box style={styles.loadingContainer}>
        {synchronization.updating && (
          <Box
            style={[
              styles.loadingIndicator,
              {
                width: `${progressPercent}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        )}
        {!synchronization.updating && (
          <Box
            style={[
              styles.loadingIndicator,
              {
                width: "100%",
                backgroundColor: statusColor,
              },
            ]}
          />
        )}
        <Text style={styles.updateText}>{displayText}</Text>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: "relative",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    minHeight: 30,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "stretch",
    zIndex: 99999999,
  },
  loadingContainer: {
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  updateText: {
    fontSize: 12,
    color: "#000",
  },
});
