import { Alert } from "@/common/Alert";
import { shareJson } from "@/services/shareFile";
import { Logger } from "@/services/Logger";
import { fetchServerDataExport } from "@/services/PersonalDataService";
import { formatDateToISO } from "@/utils/date";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Downloads every row the server stores for the signed in user as one JSON file.
 * Shows an alert when there is no session, a read fails or sharing fails.
 */
export const useServerDataExport = () => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const inFlight = useRef(false);

  const runExport = async (): Promise<void> => {
    try {
      const now = new Date();
      const data = await fetchServerDataExport(now);
      if (data === null) {
        Alert.alert(t("common.error"));
        return;
      }
      await shareJson(
        `personal-data_${formatDateToISO(now)}.json`,
        JSON.stringify(data, null, 2),
      );
    } catch (error) {
      Logger.logError(
        error instanceof Error ? error : new Error("Server data export failed"),
      );
      Alert.alert(t("common.error"));
    }
  };

  const exportData = async (): Promise<void> => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsExporting(true);
    await runExport().finally(() => {
      inFlight.current = false;
      setIsExporting(false);
    });
  };

  return { exportData, isExporting };
};
