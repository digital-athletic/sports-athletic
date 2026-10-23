import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/common/Alert";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { Logger } from "@/services/Logger";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { pickCustomWorkoutFile } from "./pickCustomWorkoutFile";
import { validateCustomWorkoutText } from "./validateCustomWorkout";

const IMPORT_ERROR_KEYS = {
  INVALID_FORMAT: "screens.home.additionalTrainings.importError.invalidFormat",
  UNSUPPORTED_CONTENT:
    "screens.home.additionalTrainings.importError.unsupportedContent",
  READ_FAILED: "screens.home.additionalTrainings.importError.readFailed",
  TOO_LARGE: "screens.home.additionalTrainings.importError.readFailed",
} as const;

type ImportErrorCode = keyof typeof IMPORT_ERROR_KEYS;

/** Resolves to the failure code, or null after a save or a canceled picker. */
const pickAndSaveCustomWorkout = async (): Promise<ImportErrorCode | null> => {
  const picked = await pickCustomWorkoutFile();
  if (picked.status === "canceled") return null;
  if (picked.status === "failed") {
    void Logger.logError(new Error(`Custom workout import: ${picked.reason}`));
    return picked.reason;
  }
  const validation = validateCustomWorkoutText(picked.text, getAllSkillTrees());
  if (!validation.success) return validation.error;
  useCustomWorkoutsStore
    .getState()
    .saveCustomWorkout(validation.template, null);
  return null;
};

/** Picks, validates and saves an AIWL file as an own training; shows an Alert on failure. */
export function useImportCustomWorkout(): {
  importCustomWorkout: () => Promise<void>;
  importing: boolean;
} {
  const { t } = useTranslation();
  const [importing, setImporting] = useState(false);
  const isRunningRef = useRef(false);

  const importCustomWorkout = async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setImporting(true);
    const errorCode = await pickAndSaveCustomWorkout().finally(() => {
      isRunningRef.current = false;
      setImporting(false);
    });
    if (!errorCode) return;
    Alert.alert(
      t("screens.home.additionalTrainings.importErrorTitle"),
      t(IMPORT_ERROR_KEYS[errorCode]),
      [{ text: t("common.ok") }],
    );
  };

  return { importCustomWorkout, importing };
}
