import { TileData } from "@/constants/workoutConstants";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useResponsiveProp } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  TouchableOpacity,
} from "react-native";

export type ColumnListProps = {
  isSubscribed: boolean;
  listItems: TileData[];
};

/**
 * Grid list component for displaying exercises/tutorials.
 * Shows image with title and optional description, handles navigation and subscription gating.
 */
export const ColumnList: FC<ColumnListProps> = ({
  isSubscribed,
  listItems,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const listItemWidth = useResponsiveProp({
    phone: 120,
    tablet: 360,
  });

  const handleNavigate = (item: TileData) => {
    if (isSubscribed) {
      const { key, params } = item.navigate;
      // @ts-expect-error Suppress ts(2345) Types of property 'pathname' are incompatible.
      // It has been verified that the allowed values are restricted to valid paths as expected.
      router.navigate({ pathname: key, params });
    } else {
      Alert.alert(
        t("subscription.expired"),
        t("subscription.chooseSubscriptionToStart"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              router.navigate({
                pathname: "/(tabs)/more/subscribe",
                params: { backPath: "SelectTraining" },
              });
            },
          },
        ]
      );
    }
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
          borderBottomWidth={1}
          borderBottomColor="lightGrey2"
          flexDirection="row"
        >
          <Image
            source={item.picture}
            resizeMode="cover"
            style={{
              width: listItemWidth,
              aspectRatio: 1,
            }}
          />
          <Box
            paddingHorizontal="m"
            paddingVertical="m"
            justifyContent="flex-start"
            flex={1}
          >
            <Text variant="cardTitle">{t(item.title)}</Text>
            {hasDescription && (
              <Box marginTop="s">
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
