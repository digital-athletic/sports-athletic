import { AwesomeIcon, type FontAwesomeIconName } from "@/common/AwesomeIcon";
import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { ThemeColor, useTheme } from "@/theme/theme";
import {
  ExternalPathString,
  Route,
  UnknownInputParams,
  useRouter,
} from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, type ImageSourcePropType } from "react-native";
import { ListDivider } from "./ListDivider";

export type ListItemProps = {
  title: string;
  navPath: Route;
  iconName?: IoniconName;
  awesomeIconName?: FontAwesomeIconName;
  iconBackground?: ThemeColor;
  picPath?: ImageSourcePropType;
  navParams?: UnknownInputParams;
  url?: ExternalPathString;
  backPath?: string;
  isLast?: boolean;
  isSubscribed?: boolean;
};

/**
 * List item component for navigation menus.
 * Renders an icon/image with text and handles navigation or URL opening.
 */
export const ListItem: FC<ListItemProps> = ({
  title,
  navPath,
  iconName,
  awesomeIconName,
  iconBackground,
  picPath,
  navParams,
  url,
  backPath,
  isLast = false,
  isSubscribed,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (typeof url === "undefined") {
      if (navPath === "/training/muscle-soreness" && !isSubscribed) {
        Alert.alert(
          t("subscription.expired"),
          t("subscription.chooseSubscriptionToStart"),
          [
            {
              text: t("common.ok"),
              onPress: () => {
                router.navigate({
                  pathname: "/(tabs)/more/subscribe",
                  params: { backPath: "PowerTest" },
                });
              },
            },
          ]
        );
        return;
      }

      // @ts-expect-error Suppress ts(2345) Types of property 'pathname' are incompatible.
      // It has been verified that the allowed values are restricted to valid paths as expected.
      router.navigate({ pathname: navPath, params: navParams });
    } else {
      router.navigate({ pathname: "/webview", params: { url, backPath } });
    }
  };

  const renderIcon = () => {
    if (iconName) {
      return (
        <Box
          width={56}
          height={56}
          borderRadius="round"
          justifyContent="center"
          alignItems="center"
          backgroundColor={iconBackground || "primary"}
        >
          <Ionicon
            name={iconName}
            size={24}
            color={colors.white}
            accessibilityLabel={t("common.altText.icon", { title })}
          />
        </Box>
      );
    } else if (picPath) {
      return (
        <Image
          source={picPath}
          resizeMode="contain"
          style={{ width: 56, height: 56 }}
          accessibilityLabel={t("common.altText.image", { title })}
        />
      );
    } else {
      return (
        <Box
          width={56}
          height={56}
          borderRadius="round"
          justifyContent="center"
          alignItems="center"
          backgroundColor={iconBackground || "primary"}
        >
          <AwesomeIcon
            name={awesomeIconName || "home"}
            size={24}
            color={colors.white}
            accessibilityLabel={t("common.altText.icon", { title })}
          />
        </Box>
      );
    }
  };

  return (
    <Box>
      <Box
        height={60}
        marginBottom="s"
        justifyContent="center"
        alignSelf="stretch"
      >
        <Button onPress={handlePress}>
          <Box
            flex={1}
            paddingHorizontal="m"
            alignSelf="stretch"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <Box flex={1}>{renderIcon()}</Box>
            <Text flex={5} variant="body" marginLeft="m" numberOfLines={1}>
              {title}
            </Text>
          </Box>
        </Button>
      </Box>
      {!isLast && <ListDivider />}
    </Box>
  );
};
