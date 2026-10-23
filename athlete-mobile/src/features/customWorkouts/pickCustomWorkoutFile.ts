import {
  type DocumentPickerAsset,
  getDocumentAsync,
} from "expo-document-picker";
import { File } from "expo-file-system";
import { Platform } from "react-native";

export const MAX_CUSTOM_WORKOUT_FILE_BYTES = 1_048_576;

export type PickedCustomWorkoutFile =
  | { status: "picked"; text: string }
  | { status: "canceled" }
  | { status: "failed"; reason: "READ_FAILED" | "TOO_LARGE" };

// Native pickers copy the file into the cache directory; web reads the browser File directly.
const openCachedCopy = (asset: DocumentPickerAsset) =>
  Platform.OS === "web" ? null : new File(asset.uri);

const deleteCachedCopy = (cachedCopy: File | null) => {
  try {
    cachedCopy?.delete();
  } catch {
    // The OS clears the cache directory on its own, so a leftover copy is harmless.
  }
};

const readPickedAssetText = async (
  asset: DocumentPickerAsset,
  cachedCopy: File | null,
) => {
  if (cachedCopy) {
    return cachedCopy.text();
  }
  if (!asset.file) {
    throw new Error("Picked web asset has no file");
  }
  return asset.file.text();
};

const readAssetWithinSizeLimit = async (
  asset: DocumentPickerAsset,
  cachedCopy: File | null,
): Promise<PickedCustomWorkoutFile> => {
  if ((asset.size ?? 0) > MAX_CUSTOM_WORKOUT_FILE_BYTES) {
    return { status: "failed", reason: "TOO_LARGE" };
  }
  const text = await readPickedAssetText(asset, cachedCopy);
  if (
    new TextEncoder().encode(text).byteLength > MAX_CUSTOM_WORKOUT_FILE_BYTES
  ) {
    return { status: "failed", reason: "TOO_LARGE" };
  }
  return { status: "picked", text };
};

/** Opens the document picker for any file type and reads the chosen file as text. */
export const pickCustomWorkoutFile =
  async (): Promise<PickedCustomWorkoutFile> => {
    try {
      // No await may run before this call: WebKit only opens the dialog inside the user gesture.
      const result = await getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      const [asset] = result.assets ?? [];
      if (result.canceled || !asset) {
        return { status: "canceled" };
      }
      const cachedCopy = openCachedCopy(asset);
      try {
        return await readAssetWithinSizeLimit(asset, cachedCopy);
      } finally {
        deleteCachedCopy(cachedCopy);
      }
    } catch {
      return { status: "failed", reason: "READ_FAILED" };
    }
  };
