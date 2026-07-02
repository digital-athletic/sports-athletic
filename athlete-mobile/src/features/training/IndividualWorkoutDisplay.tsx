import { Ionicon } from "@/common/Ionicon";
import { SharedConstants } from "@/constants/sharedConstants";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { useTheme } from "@/theme/theme";
import { ISODateToDate } from "@/utils/date";
import { useMemo, type FC } from "react";
import { useTranslation } from "react-i18next";
import { TrainingPlanStatusWidget } from "./TrainingPlanStatusWidget";
import { TrainingPlanType } from "./models/TrainingPlan";

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

// Determine plan state
const getPlanState = (
  anamnesisCompleted: boolean,
  trainingPlan: TrainingPlanType | null,
): number => {
  let planState = PLAN_STATES.NO_ANAMNESIS;

  // Check if anamnesis is completed and training plan exists
  if (anamnesisCompleted && trainingPlan) {
    planState = PLAN_STATES.RUNNING;

    // Check if plan has ended
    // ISODateToDate expects ISO 8601 format (YYYY-MM-DD) only
    if (trainingPlan.sections && trainingPlan.sections.length > 0) {
      const lastSection =
        trainingPlan.sections[trainingPlan.sections.length - 1];
      const sectionEnd =
        ISODateToDate(lastSection.start).getTime() +
        lastSection.numOfWeeks * SharedConstants.TIME_IN_MS.WEEK;
      if (sectionEnd < Date.now()) {
        planState = PLAN_STATES.ENDED;
      }
    }
  }

  return planState;
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
  const { anamnesisCompleted } = useUserProfileStore();

  const planState = useMemo(
    () => getPlanState(anamnesisCompleted, trainingPlan),
    [anamnesisCompleted, trainingPlan],
  );

  const renderRunningPlan = () => {
    return (
      <Box flex={1}>
        <Box marginBottom="l" flex={1}>
          {trainingPlan && (
            <TrainingPlanStatusWidget
              trainingSections={trainingPlan.sections}
              goToSectionDetails={goToSectionDetails}
            />
          )}
        </Box>
        <Button onPress={() => goToTraining("PLAN")}>
          {t("screens.home.startTraining")}
        </Button>
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
        flex={1}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="m"
        onPress={goTo}
      >
        <Ionicon name="add-circle" size={64} color={colors.primary} />
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
    <Box flex={1} justifyContent="space-between">
      <Text variant="title" paddingHorizontal="m" paddingTop="m">
        {t("screens.home.workoutWithOwnPlan")}
      </Text>
      {planState === PLAN_STATES.RUNNING ? renderRunningPlan() : renderNoPlan()}
    </Box>
  );
};
