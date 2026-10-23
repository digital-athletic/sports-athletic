import { SilhouetteThumbnail } from "@/bodyParts/silhouette/SilhouetteThumbnail";
import { TileData } from "@/constants/workoutConstants";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Box } from "@/theme/Box";
import { useResponsiveProp } from "@shopify/restyle";
import { type Href, useRouter } from "expo-router";
import { ColumnListRow } from "./ColumnListRow";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Image, ListRenderItem } from "react-native";

export type ColumnListProps = {
  listItems: TileData[];
};

/** Owns the profile store subscription so a gender change re-renders only the thumbnail slot, not the whole row. */
const TileThumbnail: FC<{ item: TileData; size: number }> = ({
  item,
  size,
}) => {
  const gender = useUserProfileStore((state) => state.personalData.gender);

  if (item.silhouette) {
    return (
      <SilhouetteThumbnail
        gender={gender}
        side={item.silhouette.side}
        regions={item.silhouette.regions}
        centerY={item.silhouette.centerY}
        size={size}
      />
    );
  }

  if (item.picture) {
    return (
      <Image
        source={item.picture}
        style={{ width: size, height: size }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        testID="tile-thumbnail-image"
      />
    );
  }

  return (
    <Box
      width={size}
      height={size}
      backgroundColor="white"
      borderWidth={1}
      borderColor="lightGrey2"
      testID="tile-thumbnail-placeholder"
    />
  );
};

/**
 * Grid list component for displaying exercises/tutorials.
 * Shows image with title and optional description, handles navigation.
 */
export const ColumnList: FC<ColumnListProps> = ({ listItems }) => {
  const { t } = useTranslation();
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
      <ColumnListRow
        title={t(item.title)}
        description={
          hasDescription ? t(description.text, description.params) : undefined
        }
        secondaryDescription={params.place?.toUpperCase()}
        thumbnail={<TileThumbnail item={item} size={imageSize} />}
        onPress={onPress}
      />
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
