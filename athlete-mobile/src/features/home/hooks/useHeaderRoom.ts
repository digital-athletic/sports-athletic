import { useHeaderHeight } from "expo-router/react-navigation";
import { Platform } from "react-native";

/**
 * Starts a scroll screen below the header. Only the iOS header is translucent;
 * its room is padding inside the content, because an automatic content inset
 * would add it on top of a full height content and make the screen scroll.
 */
export const useHeaderRoom = () => {
  const headerHeight = useHeaderHeight();
  const headerRoom = Platform.OS === "ios" ? headerHeight : 0;

  return {
    contentContainerStyle: { flexGrow: 1, paddingTop: headerRoom },
    scrollIndicatorInsets: { top: headerRoom },
  };
};
