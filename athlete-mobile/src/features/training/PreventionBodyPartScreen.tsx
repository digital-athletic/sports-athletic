import { SilhouetteThumbnail } from "@/bodyParts/silhouette/SilhouetteThumbnail";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { TileGrid } from "@/common/TileGrid";
import { Ionicon } from "@/common/Ionicon";
import { type TileData, WorkoutConstants } from "@/constants/workoutConstants";
import { type I18nKey } from "@/i18n";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { useResponsiveProp } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import { tileHref } from "./tileHref";

const BODY_PART_ORDER: readonly I18nKey[] = [
  "training.prevention.PREVENTION_TILE_SHOULDER",
  "training.prevention.PREVENTION_TILE_SPINE",
  "training.prevention.PREVENTION_TILE_WRIST",
  "training.prevention.PREVENTION_TILE_KNEE",
  "training.prevention.PREVENTION_TILE_ANKLE",
];

const BODY_PART_TILES = BODY_PART_ORDER.map((title) =>
  WorkoutConstants.PREVENTION_TILES.find((tile) => tile.title === title),
).filter((tile) => tile !== undefined);

type BodyPartCardProps = {
  tile: TileData;
  silhouetteSize: number;
  onPress: () => void;
};

/** Card with the highlighted silhouette above the name of the body part. */
const BodyPartCard: FC<BodyPartCardProps> = ({
  tile,
  silhouetteSize,
  onPress,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const gender = useUserProfileStore((state) => state.personalData.gender);
  const name = t(tile.title);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <Card variant="outlined" flex={1} overflow="hidden">
        <Box
          backgroundColor="lightGrey1"
          alignItems="center"
          paddingVertical="s"
        >
          {tile.silhouette && (
            <SilhouetteThumbnail
              gender={gender}
              side={tile.silhouette.side}
              regions={tile.silhouette.regions}
              centerY={tile.silhouette.centerY}
              size={silhouetteSize}
            />
          )}
        </Box>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="m"
          paddingVertical="m"
          gap="xs"
        >
          <Text variant="body" fontSize={15} fontWeight="700" flexShrink={1}>
            {name}
          </Text>
          <Ionicon
            name="chevron-forward"
            size={14}
            color={colors.lightGrey3}
            decorative
          />
        </Box>
      </Card>
    </Pressable>
  );
};

type PreventionBodyPartScreenProps = {
  /** Name of the screen for the navigator and the browser tab. */
  title: string;
  onBack: () => void;
};

/** Prevention training choice: one card per body part in a two column grid. */
export const PreventionBodyPartScreen: FC<PreventionBodyPartScreenProps> = ({
  title,
  onBack,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  // useResponsiveProp can briefly return undefined on web.
  const silhouetteSize = useResponsiveProp({ phone: 96, tablet: 128 }) ?? 96;

  return (
    <HeadlineScreen
      title={title}
      eyebrow={t("training.prevention.selection.eyebrow")}
      heading={t("training.prevention.selection.heading")}
      description={t("training.prevention.selection.description")}
      onBack={onBack}
    >
      <TileGrid>
        {BODY_PART_TILES.map((tile) => (
          <BodyPartCard
            key={tile.title}
            tile={tile}
            silhouetteSize={silhouetteSize}
            onPress={() => router.navigate(tileHref(tile))}
          />
        ))}
      </TileGrid>
    </HeadlineScreen>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "48%",
  },
  pressed: {
    opacity: 0.7,
  },
});
