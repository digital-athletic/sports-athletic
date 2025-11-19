import { AwesomeIcon, type FontAwesomeIconName } from "@/common/AwesomeIcon";
import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Button, ButtonProps } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Image, type ImageSourcePropType } from "react-native";
import { ListDivider } from "./ListDivider";

export type ListItemProps = {
  title: string;
  iconName?: IoniconName;
  awesomeIconName?: FontAwesomeIconName;
  iconBackground?: string;
  picPath?: ImageSourcePropType;
  isLast?: boolean;
} & Pick<ButtonProps, "onPress">;

/**
 * List item component for navigation menus.
 * Renders an icon/image with text and handles navigation or URL opening.
 */
export const ListItem: FC<ListItemProps> = ({
  title,
  iconName,
  awesomeIconName,
  iconBackground,
  picPath,
  isLast = false,
  onPress,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

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
        <Button onPress={onPress}>
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
