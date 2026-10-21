import { Alert } from "@/common/Alert";
import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { SUPPORT_EMAIL } from "@/constants/AppConstants";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type ThemeColor, useTheme } from "@/theme/theme";
import { useResponsiveProp } from "@shopify/restyle";
import { type Href, type RoutePath, useRouter } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Linking, TouchableOpacity } from "react-native";
import { ListDivider } from "../../common/ListDivider";

export type ListItemProps = {
  title: string;
  navPath?: RoutePath;
  externalUrl?: string;
  iconName: IoniconName;
  iconBackground: ThemeColor;
  backPath?: string;
  isLast?: boolean;
  navParams?: Record<string, string>;
};

const ListItemIcon: FC<{ name: IoniconName; background: ThemeColor }> = ({
  name,
  background,
}) => {
  const { colors } = useTheme();
  const iconContainerSize = useResponsiveProp({ phone: 30, tablet: 38 });
  const iconSize = useResponsiveProp({ phone: 16, tablet: 28 });

  return (
    <Box flex={1}>
      <Box
        width={iconContainerSize}
        height={iconContainerSize}
        borderRadius="round"
        justifyContent="center"
        alignItems="center"
        backgroundColor={background || "primary"}
      >
        <Ionicon name={name} size={iconSize} color={colors.white} decorative />
      </Box>
    </Box>
  );
};

/**
 * List item component for navigation menus.
 * Renders an Ionicon with text and handles navigation.
 */
export const ListItem: FC<ListItemProps> = ({
  title,
  navPath,
  externalUrl,
  iconName,
  iconBackground,
  isLast = false,
  navParams,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  const listItemHeight = useResponsiveProp({ phone: 40, tablet: 65 });
  const listItemMarginBottom = useResponsiveProp({ phone: 6, tablet: 16 });

  const handlePress = () => {
    if (externalUrl) {
      Linking.openURL(externalUrl).catch(() => {
        Alert.alert(
          t("more.linkError.title"),
          externalUrl.startsWith("mailto:")
            ? t("more.linkError.mailMessage", { email: SUPPORT_EMAIL })
            : t("more.linkError.message"),
        );
      });
      return;
    }

    if (!navPath) return;

    // Typed routes reject a dynamic `pathname` in the object form, so assert
    // the correlated pathname/params object as Href. navPath is a valid RoutePath.
    router.navigate({
      pathname: navPath,
      params: { originPath: "/(tabs)/more" as RoutePath, ...navParams },
    } as Href);
  };

  return (
    <Box>
      <TouchableOpacity
        onPress={handlePress}
        accessibilityRole={externalUrl ? "link" : "button"}
      >
        <Box
          justifyContent="center"
          alignSelf="stretch"
          paddingHorizontal="l"
          flexDirection="row"
          alignItems="center"
          style={{
            minHeight: listItemHeight,
            marginBottom: listItemMarginBottom,
          }}
        >
          <ListItemIcon name={iconName} background={iconBackground} />
          <Text flex={5} variant="body">
            {title}
          </Text>
        </Box>
      </TouchableOpacity>
      {!isLast && <ListDivider />}
    </Box>
  );
};
