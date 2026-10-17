import { TextInputField } from "@/form/TextInputField";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

export type TrainingRepetitionInputProps = {
  repsValue: number;
  changeReps: (value: string) => void;
  saveRepsInput: () => void;
  /** Hides the title/description block for use in compact contexts (e.g. a list row). */
  compact?: boolean;
  /** Names the field for screen readers, e.g. "Kniebeuge, Wiederholungen". */
  exerciseName?: string;
  inputTestID?: string;
  saveTestID?: string;
};

/**
 * Input form for power test repetitions with save button.
 * Displays title, description, and numeric input with icon.
 */
export const TrainingRepetitionInput: FC<TrainingRepetitionInputProps> = ({
  repsValue,
  changeReps,
  saveRepsInput,
  compact = false,
  exerciseName,
  inputTestID,
  saveTestID,
}) => {
  const { t } = useTranslation();

  return (
    <Box flex={1} justifyContent="space-evenly" padding="m">
      {/* Title and description */}
      {!compact && (
        <Box alignSelf="stretch" justifyContent="flex-end">
          <Text variant="title">{t("training.powerTest.title")}</Text>
          <Text variant="body" textAlign="left">
            {t("training.powerTest.description")}
          </Text>
        </Box>
      )}
      <Box justifyContent="flex-end" marginTop="s">
        <TextInputField
          value={repsValue.toString()}
          placeholder={t("training.powerTest.placeholder")}
          accessibilityLabel={
            exerciseName
              ? t("training.powerTest.inputLabel", { exercise: exerciseName })
              : t("training.powerTest.placeholder")
          }
          iconName="keypad"
          onChange={changeReps}
          keyboardType="number-pad"
          testID={inputTestID}
        />

        <Button
          onPress={saveRepsInput}
          variant="primary"
          marginTop="m"
          testID={saveTestID}
        >
          {t("common.save")}
        </Button>
      </Box>
    </Box>
  );
};
