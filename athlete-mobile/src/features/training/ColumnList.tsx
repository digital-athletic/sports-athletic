import { Ionicon } from "@/common/Ionicon";
import { TileData } from "@/constants/workoutConstants";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { useResponsiveProp } from "@shopify/restyle";
import { type Href, useRouter } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ListRenderItem, TouchableOpacity } from "react-native";

export type ColumnListProps = {
  listItems: TileData[];
};

/**
 * Grid list component for displaying exercises/tutorials.
 * Shows image with title and optional description, handles navigation.
 */
export const ColumnList: FC<ColumnListProps> = ({ listItems }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  // useResponsiveProp can briefly return undefined on web, so fall back to a
  // compact fixed size to keep rows from rendering at the image's natural size.
  const imageSize =
    useResponsiveProp({
      phone: 96,
      tablet: 140,
    }) ?? 96;

  const handleNavigate = (item: TileData) => {
    const { key, params } = item.navigate;
    // Typed routes reject a dynamic `pathname` in the object form, so assert
    // the correlated pathname/params object as Href. key is a valid Route.
    router.navigate({ pathname: key, params } as Href);
  };

  const renderItem: ListRenderItem<TileData> = ({ item }) => {
    const { description } = item;
    const params = description?.params || {};
    const hasDescription = description !== undefined;
    const onPress = () => handleNavigate(item);

    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Box
          position="relative"
          width="100%"
          backgroundColor="white"
          borderBottomWidth={1}
          borderBottomColor="lightGrey2"
          flexDirection="row"
          alignItems="center"
        >
          <Box
            width={imageSize}
            height={imageSize}
            backgroundColor="white"
            borderWidth={1}
            borderColor="lightGrey2"
          />
          <Box
            paddingHorizontal="m"
            paddingVertical="m"
            justifyContent="center"
            flex={1}
          >
            <Text
              variant="cardTitle"
              marginBottom={hasDescription ? "xs" : "none"}
            >
              {t(item.title)}
            </Text>
            {hasDescription && (
              <Box>
                <Text variant="body" color="darkGrey1">
                  {t(description.text, description.params)}
                </Text>
                {params.place && (
                  <Text variant="body" color="darkGrey1" marginTop="xs">
                    {params.place.toUpperCase()}
                  </Text>
                )}
              </Box>
            )}
          </Box>
          <Box paddingRight="m">
            <Ionicon
              name="chevron-forward"
              size={20}
              color={colors.lightGrey3}
            />
          </Box>
        </Box>
      </TouchableOpacity>
    );
  };

  return (
    <Box flex={1} justifyContent="center" alignItems="stretch">
      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.title + index}
      />
    </Box>
  );
};
