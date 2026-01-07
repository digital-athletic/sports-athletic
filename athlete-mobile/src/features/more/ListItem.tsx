import { AwesomeIcon, type FontAwesomeIconName } from "@/common/AwesomeIcon";
import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { ThemeColor, useTheme } from "@/theme/theme";
import { useResponsiveProp } from "@shopify/restyle";
import { Route, useRouter } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  type ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { ListDivider } from "../../common/ListDivider";

export type ListItemProps = {
  title: string;
  navPath: Route;
  iconBackground: ThemeColor;
  backPath?: string;
  isLast?: boolean;
  isSubscribed?: boolean;
  navParams?: Record<string, string>;
} & (
  | {
      awesomeIconName: FontAwesomeIconName;
      iconName?: never;
      picPath?: never;
    }
  | {
      awesomeIconName?: never;
      iconName: IoniconName;
      picPath?: never;
    }
  | {
      awesomeIconName?: never;
      iconName?: never;
      picPath: ImageSourcePropType;
    }
);

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
  isLast = false,
  isSubscribed,
  navParams,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const iconContainerSize = useResponsiveProp({ phone: 30, tablet: 38 });
  const iconSize = useResponsiveProp({ phone: 16, tablet: 28 });
  const listItemHeight = useResponsiveProp({ phone: 40, tablet: 65 });
  const listItemMarginBottom = useResponsiveProp({ phone: 6, tablet: 16 });

  const handlePress = () => {
    if (navPath === "/training/muscle-soreness" && !isSubscribed) {
      Alert.alert(
        t("subscription.expired"),
        t("subscription.chooseSubscriptionToStart"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              router.navigate({
                pathname: "/(tabs)/(more)/subscribe",
                params: { backPath: "PowerTest" },
              });
            },
          },
        ],
      );
      return;
    }

    // @ts-expect-error Suppress ts(2345) Types of property 'pathname' are incompatible.
    // It has been verified that the allowed values are restricted to valid paths as expected.
    router.navigate({
      pathname: navPath,
      params: { originPath: "/(tabs)/more" as Route, ...navParams },
    });
  };

  return (
    <Box>
      <TouchableOpacity onPress={handlePress}>
        <Box
          justifyContent="center"
          alignSelf="stretch"
          paddingHorizontal="l"
          flexDirection="row"
          alignItems="center"
          style={{ height: listItemHeight, marginBottom: listItemMarginBottom }}
        >
          <Box flex={1}>
            {picPath ? (
              <Image
                source={picPath}
                resizeMode="contain"
                style={{ width: iconContainerSize, height: iconContainerSize }}
                accessibilityLabel={t("common.altText.image", { title })}
              />
            ) : (
              <Box
                width={iconContainerSize}
                height={iconContainerSize}
                borderRadius="round"
                justifyContent="center"
                alignItems="center"
                backgroundColor={iconBackground || "primary"}
              >
                {iconName ? (
                  <Ionicon
                    name={iconName}
                    size={iconSize}
                    color={colors.white}
                    accessibilityLabel={t("common.altText.icon", { title })}
                  />
                ) : (
                  <AwesomeIcon
                    name={awesomeIconName || "home"}
                    size={iconSize}
                    color={colors.white}
                    accessibilityLabel={t("common.altText.icon", { title })}
                  />
                )}
              </Box>
            )}
          </Box>
          <Text flex={5} variant="body" numberOfLines={1}>
            {title}
          </Text>
        </Box>
      </TouchableOpacity>
      {!isLast && <ListDivider />}
    </Box>
  );
};
