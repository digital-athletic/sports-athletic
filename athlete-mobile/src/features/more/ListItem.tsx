import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { useOpenExternalUrl } from "@/features/more/useOpenExternalUrl";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type ThemeColor, useTheme } from "@/theme/theme";
import { useResponsiveProp } from "@shopify/restyle";
import { type Href, type RoutePath, useRouter } from "expo-router";
import { type FC } from "react";
import { TouchableOpacity } from "react-native";
import { ListDivider } from "../../common/ListDivider";

// Icon color per circle background, so the icon stays readable in both schemes.
const ICON_COLORS = {
  primary: "onPrimary",
  onSurfaceVariant: "surface",
} as const satisfies Record<string, ThemeColor>;

type ListItemIconBackground = keyof typeof ICON_COLORS;

export type ListItemProps = {
  title: string;
  navPath?: RoutePath;
  externalUrl?: string;
  icon: AppIconSource;
  iconBackground: ListItemIconBackground;
  backPath?: string;
  isLast?: boolean;
  navParams?: Record<string, string>;
};

const ListItemIcon: FC<{
  icon: AppIconSource;
  background: ListItemIconBackground;
}> = ({ icon, background }) => {
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
        backgroundColor={background}
      >
        <AppIcon
          icon={icon}
          size={iconSize}
          color={colors[ICON_COLORS[background]]}
          decorative
        />
      </Box>
    </Box>
  );
};

/**
 * List item component for navigation menus.
 * Renders an icon with text and handles navigation.
 */
export const ListItem: FC<ListItemProps> = ({
  title,
  navPath,
  externalUrl,
  icon,
  iconBackground,
  isLast = false,
  navParams,
}) => {
  const router = useRouter();
  const openExternalUrl = useOpenExternalUrl();

  const listItemHeight = useResponsiveProp({ phone: 40, tablet: 65 });
  const listItemMarginBottom = useResponsiveProp({ phone: 6, tablet: 16 });

  const handlePress = () => {
    if (externalUrl) {
      openExternalUrl(externalUrl);
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
          <ListItemIcon icon={icon} background={iconBackground} />
          <Text flex={5} variant="body">
            {title}
          </Text>
        </Box>
      </TouchableOpacity>
      {!isLast && <ListDivider />}
    </Box>
  );
};
