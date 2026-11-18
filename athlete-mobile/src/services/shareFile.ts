import { File, Paths } from "expo-file-system";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { Platform } from "react-native";

interface FileType {
  webType: string;
  mimeType: string;
  UTI: string;
}

const CSV: FileType = {
  webType: "text/csv;charset=utf-8",
  mimeType: "text/csv",
  UTI: "public.comma-separated-values-text",
};

const JSON_FILE: FileType = {
  webType: "application/json;charset=utf-8",
  mimeType: "application/json",
  UTI: "public.json",
};

const downloadOnWeb = (
  fileName: string,
  content: string,
  type: FileType,
): void => {
  const url = URL.createObjectURL(new Blob([content], { type: type.webType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Some browsers start the download after click returns.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const shareOnNative = async (
  fileName: string,
  content: string,
  type: FileType,
): Promise<void> => {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (!(await isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }
  await shareAsync(file.uri, { mimeType: type.mimeType, UTI: type.UTI });
};

const shareFile = async (
  fileName: string,
  content: string,
  type: FileType,
): Promise<void> => {
  if (Platform.OS === "web") {
    downloadOnWeb(fileName, content, type);
    return;
  }
  await shareOnNative(fileName, content, type);
};

/** Downloads the CSV on web and opens the share sheet on native. */
export const shareCsv = (fileName: string, csv: string): Promise<void> =>
  shareFile(fileName, csv, CSV);

/** Downloads the JSON on web and opens the share sheet on native. */
export const shareJson = (fileName: string, json: string): Promise<void> =>
  shareFile(fileName, json, JSON_FILE);
