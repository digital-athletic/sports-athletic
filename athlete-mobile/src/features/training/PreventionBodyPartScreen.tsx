import { SilhouetteThumbnail } from "@/bodyParts/silhouette/SilhouetteThumbnail";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { TileCard, useTileCardHeaderHeight } from "@/common/TileCard";
import { TileGrid } from "@/common/TileGrid";
import { type TileData, WorkoutConstants } from "@/constants/workoutConstants";
import { type I18nKey } from "@/i18n";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useTheme } from "@/theme/theme";
import { useRouter } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
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
  onPress: () => void;
};

/** Card with the highlighted silhouette above the name of the body part. */
const BodyPartCard: FC<BodyPartCardProps> = ({ tile, onPress }) => {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const gender = useUserProfileStore((state) => state.personalData.gender);
  const silhouetteSize = useTileCardHeaderHeight() - 2 * spacing.s;

  return (
    <TileCard title={t(tile.title)} onPress={onPress}>
      {tile.silhouette && (
        <SilhouetteThumbnail
          gender={gender}
          side={tile.silhouette.side}
          regions={tile.silhouette.regions}
          centerY={tile.silhouette.centerY}
          size={silhouetteSize}
        />
      )}
    </TileCard>
  );
};

type PreventionBodyPartScreenProps = {
  /** Name of the screen for the navigator and the browser tab. */
  title: string;
  onBack: () => void;
};

/** Prevention training choice: one card per body part in a grid. */
export const PreventionBodyPartScreen: FC<PreventionBodyPartScreenProps> = ({
  title,
  onBack,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

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
            onPress={() => router.navigate(tileHref(tile))}
          />
        ))}
      </TileGrid>
    </HeadlineScreen>
  );
};
