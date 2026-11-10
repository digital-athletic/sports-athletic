import { HeadlineScreen } from "@/common/HeadlineScreen";
import { TrainingTile } from "@/common/TrainingTile";
import { type TileData, WorkoutConstants } from "@/constants/workoutConstants";
import { Box } from "@/theme/Box";
import { type Href, router } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

type FocusTrainingGridProps = {
  title: string;
  onBack?: () => void;
};

// Two half tiles on a tablet would grow to the size of a phone screen each.
const GRID_MAX_WIDTH = 640;

const openTraining = ({ navigate }: TileData) => {
  // Typed routes reject a dynamic pathname in the object form; key is a valid Route.
  router.navigate({ pathname: navigate.key, params: navigate.params } as Href);
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
      <Box
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="space-between"
        rowGap="m"
        width="100%"
        maxWidth={GRID_MAX_WIDTH}
      >
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
            onPress={() => openTraining(tile)}
          />
        ))}
      </Box>
    </HeadlineScreen>
  );
};
