import { useExerciseSheetTimer } from "@/features/training/hooks/useExerciseSheetTimer";
import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { type SheetRest } from "@/features/training/utils/checklistRest";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { type FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TrainingSheetHeading } from "./TrainingSheetHeading";

type Props = {
  rest: SheetRest;
  isActive: boolean;
  onEnd: (skipped: boolean) => void;
};

/**
 * Rest screen of the checklist sheet: the rest countdown in the same style as
 * the exercise countdown, and a skip button.
 */
export const TrainingRestStep: FC<Props> = ({ rest, isActive, onEnd }) => {
  const { t } = useTranslation();
  const { displayedSeconds, isCountingDown } = useExerciseSheetTimer({
    exerciseId: PAUSE_EXERCISE_ID,
    duration: rest.duration,
    isActive,
  });

  useEffect(() => {
    if (!isCountingDown) onEnd(false);
  }, [isCountingDown, onEnd]);

  return (
    <Box gap="m" testID="training-list-sheet-rest">
      <TrainingSheetHeading
        title={t("training.active.pause.label")}
        seconds={displayedSeconds}
        isTimed
        timerTestID="training-list-sheet-rest-timer"
      />
      <Button
        variant="secondary"
        onPress={() => onEnd(true)}
        testID="training-list-sheet-rest-skip"
      >
        {t("training.list.rest.skip")}
      </Button>
    </Box>
  );
};
