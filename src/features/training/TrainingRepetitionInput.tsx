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
};

/**
 * Input form for power test repetitions with save button.
 * Displays title, description, and numeric input with icon.
 */
export const TrainingRepetitionInput: FC<TrainingRepetitionInputProps> = ({
  repsValue,
  changeReps,
  saveRepsInput,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      flex={1}
      justifyContent="space-between"
      alignItems="stretch"
      alignSelf="stretch"
      paddingHorizontal="m"
    >
      {/* Title and description */}
      <Box alignSelf="stretch" justifyContent="flex-start" alignItems="stretch">
        <Text variant="title" marginBottom="s">
          {t("training.powerTest.title")}
        </Text>
        <Text variant="body" textAlign="left">
          {t("training.powerTest.description")}
        </Text>
      </Box>

      {/* Input field */}
      <TextInputField
        value={repsValue.toString()}
        placeholder={t("training.powerTest.placeholder")}
        awesomeIconName="hashtag"
        onChange={changeReps}
        keyboardType="number-pad"
      />

      {/* Save button */}
      <Button onPress={saveRepsInput} variant="primary">
        {t("common.save")}
      </Button>
    </Box>
  );
};
