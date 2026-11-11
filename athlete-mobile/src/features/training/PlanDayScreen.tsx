import { HeadlineScreen } from "@/common/HeadlineScreen";
import { TileGrid } from "@/common/TileGrid";
import { TrainingTile } from "@/common/TrainingTile";
import { type TileData } from "@/constants/workoutConstants";
import { router } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { tileHref } from "./tileHref";

type PlanDayScreenProps = {
  /** Name of the screen for the navigator and the browser tab. */
  title: string;
  /** Name of the current plan phase, shown above the heading. */
  phase?: string;
  days: TileData[];
  onBack: () => void;
};

/** The training days of the current plan week as photo tiles in a grid. */
export const PlanDayScreen: FC<PlanDayScreenProps> = ({
  title,
  phase,
  days,
  onBack,
}) => {
  const { t } = useTranslation();

  return (
    <HeadlineScreen
      title={title}
      eyebrow={phase && t("training.selectTraining.eyebrow", { phase })}
      heading={t("training.selectTraining.heading")}
      description={t("training.selectTraining.description")}
      onBack={onBack}
    >
      <TileGrid testID="plan-days">
        {days.map((day, index) => (
          <TrainingTile
            key={day.title + index}
            image={day.picture}
            title={t(day.title)}
            description={
              day.description && t(day.description.text, day.description.params)
            }
            onPress={() => router.navigate(tileHref(day))}
          />
        ))}
      </TileGrid>
    </HeadlineScreen>
  );
};
