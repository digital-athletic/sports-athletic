import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/common/Alert";
import { Logger } from "@/services/Logger";
import { shareCsv } from "@/services/shareFile";

const toError = (value: unknown): Error =>
  value instanceof Error ? value : new Error("CSV export failed");

/**
 * Shares a CSV file, downloaded on web and through the share sheet on native. A call while a share runs is
 * ignored. A failed share is logged and shown as the common error alert instead of thrown.
 */
export function useCsvShare(): {
  share: (fileName: string, csv: string) => Promise<void>;
  isSharing: boolean;
} {
  const { t } = useTranslation();
  const [isSharing, setIsSharing] = useState(false);
  // The ref blocks a second call in the same render, before the state update arrives.
  const inFlight = useRef(false);

  const share = async (fileName: string, csv: string): Promise<void> => {
    if (inFlight.current) return;

    inFlight.current = true;
    setIsSharing(true);
    try {
      await shareCsv(fileName, csv);
    } catch (error) {
      Logger.logError(toError(error));
      Alert.alert(t("common.error"));
    }

    // The catch reports every failure without rethrowing, so the reset always runs.
    inFlight.current = false;
    setIsSharing(false);
  };

  return { share, isSharing };
}
