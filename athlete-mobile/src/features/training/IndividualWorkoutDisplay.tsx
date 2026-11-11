import { AppIcon } from "@/common/AppIcon";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { useTheme } from "@/theme/theme";
import { useWindowClass } from "@/theme/useWindowClass";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { TrainingPlanStatusWidget } from "./TrainingPlanStatusWidget";
import { TrainingPlanType } from "./models/TrainingPlan";
import { isPlanEnded } from "./utils/timeUtils";
import IconCirclePlus from "@tabler/icons-react-native/IconCirclePlus";

const PLAN_STATES = {
  NO_ANAMNESIS: 0,
  RUNNING: 2,
  ENDED: 4,
};

interface IndividualWorkoutDisplayProps {
  goToTraining: (type: "QUICK" | "PREV" | "PLAN") => void;
  goToAnamnesis: () => void;
  goToSeasonPhase: () => void;
  goToSectionDetails: (index: number) => void;
}

const getPlanState = (
  anamnesisCompleted: boolean,
  trainingPlan: TrainingPlanType | null,
): number => {
  if (!anamnesisCompleted || !trainingPlan) return PLAN_STATES.NO_ANAMNESIS;
  return isPlanEnded(trainingPlan, new Date())
    ? PLAN_STATES.ENDED
    : PLAN_STATES.RUNNING;
};

/**
 * Displays individual workout plan status and provides navigation to training options.
 * Shows different content based on plan state: anamnesis incomplete, plan running, or plan ended.
 */
export const IndividualWorkoutDisplay: FC<IndividualWorkoutDisplayProps> = ({
  goToTraining,
  goToAnamnesis,
  goToSeasonPhase,
  goToSectionDetails,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { trainingPlan } = useUserWorkoutStore();
  const isShortLandscape = useWindowClass() === "shortLandscape";
  const { anamnesisCompleted } = useUserProfileStore();

  const planState = getPlanState(anamnesisCompleted, trainingPlan);

  const startButton = (
    <Button variant="cta" onPress={() => goToTraining("PLAN")}>
      {t("screens.home.startTraining")}
    </Button>
  );

  const renderRunningPlan = () => {
    return (
      <Box flexGrow={1} gap="m">
        {/* In a short landscape window the plan section tiles are taller than
            the screen. The start button goes on top, so it stays in view
            without scrolling. */}
        {isShortLandscape && startButton}
        <Box flexGrow={1}>
          {trainingPlan && (
            <TrainingPlanStatusWidget
              trainingSections={trainingPlan.sections}
              goToSectionDetails={goToSectionDetails}
            />
          )}
        </Box>
        {!isShortLandscape && startButton}
      </Box>
    );
  };

  const renderNoPlan = () => {
    const isPhaseEnded = planState === PLAN_STATES.ENDED;
    const goTo = isPhaseEnded ? goToSeasonPhase : goToAnamnesis;
    const messageKey = isPhaseEnded
      ? "screens.home.phaseEnded"
      : "screens.home.incompleteAnamnesis";

    return (
      <TouchableBox
        flexGrow={1}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="m"
        onPress={goTo}
      >
        <AppIcon
          icon={IconCirclePlus}
          size={64}
          color={colors.primary}
          decorative
        />
        <Text
          variant="description"
          textAlign="center"
          marginTop="m"
          color="primary"
        >
          {t(messageKey)}
        </Text>
      </TouchableBox>
    );
  };

  return (
    <Box flexGrow={1} justifyContent="space-between">
      <Text variant="sectionLabel" accessibilityRole="header" marginBottom="m">
        {t("screens.home.workoutWithOwnPlan")}
      </Text>
      {planState === PLAN_STATES.RUNNING ? renderRunningPlan() : renderNoPlan()}
    </Box>
  );
};
