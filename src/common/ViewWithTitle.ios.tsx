import { type FC, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { Box } from "../theme/Box";
import { ThemeColor, useTheme } from "../theme/theme";
import { Ionicon } from "./Ionicon";

const HEADER_HEIGHT = 44;

const truncateTitle = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 2) + "...";
  }
  return text;
};

type Props = {
  title: string;
  fixed: boolean;
  backgroundColor?: ThemeColor;
  onBack?: () => void;
  onClose?: () => void;
  hideTitle?: boolean;
  innerBackgroundColor?: ThemeColor;
};

/**
 * ViewWithTitle Component
 *
 * A container view with a title bar, optional back/close buttons, and scrollable or fixed content.
 */
export const ViewWithTitle: FC<PropsWithChildren<Props>> = ({
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

  const containerBackgroundColor = backgroundColor || "white";
  const titleText = truncateTitle(title ?? "", 34);
  const contentAreaBackgroundColor = innerBackgroundColor || "white";
  const borderBottomColor = theme.colors.iosTitleBorder;
  const headerHeight = hideTitle ? 0 : HEADER_HEIGHT;

  return (
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
        <Animated.View
          style={[
            styles.titleContainer,
            {
              height: headerHeight,
              borderBottomColor,
            },
          ]}
        >
          <Animated.View
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: headerHeight,
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
              {titleText}
            </Text>
          </Animated.View>
        </Animated.View>
        <TouchableOpacity
          style={styles.backContainer}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <Ionicon name="arrow-back" size={30} color={theme.colors.black} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeContainer}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("common.skip")}
        >
          <Text
            style={{
              ...styles.skip,
              marginLeft: theme.spacing.m,
              color: theme.colors.darkGrey1,
            }}
          >
            {t("common.skip")}
          </Text>
        </TouchableOpacity>
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
    height: 44,
    width: 54,
    overflow: "hidden",
  },
  closeContainer: {
    ...baseButton,
    right: 16,
    height: 54,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    overflow: "hidden",
  },
  skip: {
    fontWeight: "600",
    fontFamily: "System",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 3,
  },
  titleContainer: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "flex-end",
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: "600",
    backgroundColor: "transparent",
    marginLeft: 0,
    fontSize: 17,
    lineHeight: 52,
  },
});
