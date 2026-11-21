import { HeadlineScreen } from "@/common/HeadlineScreen";
import { TileGrid } from "@/common/TileGrid";
import { TrainingTile } from "@/common/TrainingTile";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { router } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconRocket from "@tabler/icons-react-native/IconRocket";
import { tileHref } from "./tileHref";

type AthleticWarmupGridProps = {
  title: string;
  onBack?: () => void;
};

const TILE_TEST_IDS = [
  "athletic-warmup-short-tile",
  "athletic-warmup-long-tile",
];

/** The athletic warm-ups as rocket tiles, one per duration. */
export const AthleticWarmupGrid: FC<AthleticWarmupGridProps> = ({
  title,
  onBack,
}) => {
  const { t } = useTranslation();

  return (
    <HeadlineScreen
      title={title}
      eyebrow={t("training.athleticWarmup.gridEyebrow")}
      heading={t("training.athleticWarmup.gridHeading")}
      onBack={onBack}
    >
      <TileGrid>
        {WorkoutConstants.ATHLETIC_WARMUP_TILES.map((tile, index) => (
          <TrainingTile
            key={tile.title}
            title={t(tile.title)}
            description={tile.description && t(tile.description.text)}
            icon={IconRocket}
            onPress={() => router.navigate(tileHref(tile))}
            testID={TILE_TEST_IDS[index]}
          />
        ))}
      </TileGrid>
    </HeadlineScreen>
  );
};
