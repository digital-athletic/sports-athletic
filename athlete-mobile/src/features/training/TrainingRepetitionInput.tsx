import { TextInputField } from "@/form/TextInputField";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useState, type FC } from "react";
import { useTranslation } from "react-i18next";

export type TrainingRepetitionInputProps = {
  repsValue: number;
  changeReps: (value: string) => void;
  saveRepsInput: () => void;
  onInputFocusChange?: (isFocused: boolean) => void;
};

/**
 * Input form for power test repetitions with save button.
 * Displays title, description, and numeric input with icon.
 */
export const TrainingRepetitionInput: FC<TrainingRepetitionInputProps> = ({
  repsValue,
  changeReps,
  saveRepsInput,
  onInputFocusChange,
}) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onInputFocusChange?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onInputFocusChange?.(false);
  };

  return (
    <Box flex={1} justifyContent="space-evenly" paddingHorizontal="m">
      {/* Title and description - hidden when input focused */}
      {!isFocused && (
        <Box alignSelf="stretch" justifyContent="flex-end">
          <Text variant="title" marginBottom="s">
            {t("training.powerTest.title")}
          </Text>
          <Text variant="body" textAlign="left">
            {t("training.powerTest.description")}
          </Text>
        </Box>
      )}
      <Box justifyContent="flex-end" marginBottom={"m"}>
        <TextInputField
          value={repsValue.toString()}
          placeholder={t("training.powerTest.placeholder")}
          awesomeIconName="hashtag"
          onChange={changeReps}
          keyboardType="number-pad"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        <Button onPress={saveRepsInput} variant="primary" marginTop={"m"}>
          {t("common.save")}
        </Button>
      </Box>
    </Box>
  );
};
