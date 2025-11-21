import { type FC, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "../theme/Box";
import { ThemeColor, useTheme } from "../theme/theme";
import { Ionicon } from "./Ionicon";

const HEADER_HEIGHT = 56;

const truncateTitle = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 2) + "...";
  }
  return text;
};

export interface ViewWithTitleProps extends PropsWithChildren {
  title: string;
  fixed: boolean;
  backgroundColor?: ThemeColor;
  onBack?: () => void;
  onClose?: () => void;
  hideTitle?: boolean;
  innerBackgroundColor?: ThemeColor;
}

/**
 * ViewWithTitle Component
 *
 * A container view with a title bar, optional back/close buttons, and scrollable or fixed content.
 */
export const ViewWithTitle: FC<ViewWithTitleProps> = ({
  title,
  fixed,
  backgroundColor,
  onBack,
  onClose,
  hideTitle = false,
  innerBackgroundColor,
  children,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const displayTitle = truncateTitle(title ?? "", 38);
  const containerBackgroundColor = backgroundColor || "white";
  const contentAreaBackgroundColor = innerBackgroundColor || "white";
  const borderBottomColor = theme.colors.iosTitleBorder;
  const headerHeight = hideTitle ? 0 : HEADER_HEIGHT;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Box
        flex={1}
        alignItems="stretch"
        backgroundColor={containerBackgroundColor}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.lightGrey1}
          translucent={false}
        />
        <Box flexDirection="row" height={headerHeight}>
          <View
            style={[
              styles.titleContainer,
              {
                height: HEADER_HEIGHT,
                borderBottomColor,
              },
            ]}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: HEADER_HEIGHT,
              }}
            >
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.darkGrey3,
                  },
                ]}
              >
                {displayTitle}
              </Text>
            </View>
          </View>
          {!!onBack && (
            <TouchableOpacity
              style={styles.backContainer}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t("common.back")}
            >
              <Ionicon name="arrow-back" size={24} color={theme.colors.black} />
            </TouchableOpacity>
          )}
          {!!onClose && (
            <TouchableOpacity
              style={styles.closeContainer}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("common.skip")}
            >
              <Text style={{ ...styles.skip, color: theme.colors.darkGrey1 }}>
                {t("common.skip")}
              </Text>
            </TouchableOpacity>
          )}
        </Box>
        <Box flex={1} backgroundColor={contentAreaBackgroundColor}>
          {fixed ? (
            children
          ) : (
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={scrollHandler}
            >
              <Box flex={1}>{children}</Box>
            </Animated.ScrollView>
          )}
        </Box>
      </Box>
    </SafeAreaView>
  );
};

const baseButton = {
  position: "absolute",
  bottom: 0,
  backgroundColor: "transparent",
  justifyContent: "center",
  alignItems: "center",
} as ViewStyle;

const styles = StyleSheet.create({
  backContainer: {
    ...baseButton,
    left: 0,
    height: 54,
    width: 54,
  },
  closeContainer: {
    ...baseButton,
    right: 0,
    height: 54,
    width: 154,
  },
  safeArea: {
    flex: 1,
  },
  skip: {
    fontFamily: "System",
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 21,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "flex-end",
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: "600",
    backgroundColor: "transparent",
    marginLeft: 72,
    fontSize: 20,
    lineHeight: 20,
    color: "#353535",
  },
});
