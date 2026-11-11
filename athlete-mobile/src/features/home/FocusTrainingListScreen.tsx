import { HeadlineScreen } from "@/common/HeadlineScreen";
import { TrainingTile } from "@/common/TrainingTile";
import { useTrainingStore } from "@/features/training/trainingStore";
import { Box } from "@/theme/Box";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import IconShieldHeart from "@tabler/icons-react-native/IconShieldHeart";
import IconTargetArrow from "@tabler/icons-react-native/IconTargetArrow";

export default function FocusTrainingListScreen() {
  const { t } = useTranslation();
  const { setTrainingSelection } = useTrainingStore();

  const startTraining = (type: "QUICK" | "PREV") => {
    setTrainingSelection(type);
    router.push({ pathname: "/training", params: { type } });
  };

  return (
    <HeadlineScreen
      title={t("screens.home.focusTrainings.title")}
      heading={t("screens.home.focusTrainings.title")}
      description={t("screens.home.focusTrainings.subtitle")}
    >
      <Box gap="l">
        <TrainingTile
          size="full"
          icon={IconTargetArrow}
          title={t("screens.home.focusTraining.title")}
          description={t("screens.home.focusTraining.subtitle")}
          onPress={() => startTraining("QUICK")}
          testID="focus-training-tile"
        />
        <TrainingTile
          size="full"
          icon={IconShieldHeart}
          title={t("screens.home.preventionTraining.title")}
          description={t("screens.home.preventionTraining.subtitle")}
          onPress={() => startTraining("PREV")}
          testID="prevention-training-tile"
        />
      </Box>
    </HeadlineScreen>
  );
}
