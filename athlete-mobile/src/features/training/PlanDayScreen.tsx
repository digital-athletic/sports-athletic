import { HeadlineScreen } from "@/common/HeadlineScreen";
import { TrainingTile } from "@/common/TrainingTile";
import { type TileData } from "@/constants/workoutConstants";
import { Box } from "@/theme/Box";
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

/** The training days of the current plan week as large photo tiles. */
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
      <Box gap="m" testID="plan-days">
        {days.map((day, index) => (
          <TrainingTile
            key={day.title + index}
            size="full"
            image={day.picture}
            title={t(day.title)}
            description={
              day.description && t(day.description.text, day.description.params)
            }
            onPress={() => router.navigate(tileHref(day))}
          />
        ))}
      </Box>
    </HeadlineScreen>
  );
};
