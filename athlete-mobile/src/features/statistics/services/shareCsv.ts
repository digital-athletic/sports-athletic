import { File, Paths } from "expo-file-system";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { Platform } from "react-native";

const downloadOnWeb = (fileName: string, csv: string): void => {
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Some browsers start the download after click returns.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const shareOnNative = async (fileName: string, csv: string): Promise<void> => {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  if (!(await isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }
  await shareAsync(file.uri, {
    mimeType: "text/csv",
    UTI: "public.comma-separated-values-text",
  });
};

/** Downloads the CSV on web and opens the share sheet on native. */
export const shareCsv = async (
  fileName: string,
  csv: string,
): Promise<void> => {
  if (Platform.OS === "web") {
    downloadOnWeb(fileName, csv);
    return;
  }
  await shareOnNative(fileName, csv);
};
