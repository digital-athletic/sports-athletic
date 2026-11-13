import { Platform, Share } from "react-native";

export type ShareWorkoutResult = "shared" | "copied" | "dismissed";

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

// Mobile browsers offer a share sheet; desktop browsers mostly lack one or refuse it.
const shareOnWeb = async (text: string): Promise<ShareWorkoutResult> => {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "dismissed";
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
};

/**
 * Opens the share sheet of iOS, Android or the browser. Without a browser
 * share sheet, web copies the text to the clipboard.
 */
export const shareWorkoutText = async (
  text: string,
): Promise<ShareWorkoutResult> => {
  if (Platform.OS === "web") return shareOnWeb(text);
  const { action } = await Share.share({ message: text });
  return action === Share.dismissedAction ? "dismissed" : "shared";
};
