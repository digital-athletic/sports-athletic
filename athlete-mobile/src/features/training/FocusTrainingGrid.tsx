import { HeadlineScreen } from "@/common/HeadlineScreen";
import { TrainingTile } from "@/common/TrainingTile";
import { TileGrid } from "@/common/TileGrid";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { router } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { tileHref } from "./tileHref";

type FocusTrainingGridProps = {
  title: string;
  onBack?: () => void;
};

/** Focus trainings as a two column grid of photo tiles under a headline. */
export const FocusTrainingGrid: FC<FocusTrainingGridProps> = ({
  title,
  onBack,
}) => {
  const { t } = useTranslation();

  return (
    <HeadlineScreen
      title={title}
      eyebrow={t("training.quickstart.gridEyebrow")}
      heading={t("training.quickstart.gridHeading")}
      onBack={onBack}
    >
      <TileGrid>
        {WorkoutConstants.QUICKSTART_TILES.map((tile) => (
          <TrainingTile
            key={tile.title}
            title={t(tile.title)}
            description={
              tile.description &&
              t(tile.description.text, tile.description.params)
            }
            image={tile.picture}
            size="half"
            onPress={() => router.navigate(tileHref(tile))}
          />
        ))}
      </TileGrid>
    </HeadlineScreen>
  );
};
