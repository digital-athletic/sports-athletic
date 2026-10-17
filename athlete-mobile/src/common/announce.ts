import { useEffect } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * Speaks a message on iOS. Android speaks the same text through
 * `accessibilityLiveRegion` on the visible element, so this does nothing there
 * and the message is never announced twice.
 */
export const announce = (message: string): void => {
  if (Platform.OS !== "ios" || !message) return;
  AccessibilityInfo.announceForAccessibility(message);
};

/** Announces `message` each time it changes to a non-empty text. */
export const useAnnounce = (message: string | null | undefined): void => {
  useEffect(() => {
    if (message) announce(message);
  }, [message]);
};

/** Live region props for a status text that appears on screen (Android). */
export const liveRegionProps = {
  accessibilityLiveRegion: "polite",
} as const;
