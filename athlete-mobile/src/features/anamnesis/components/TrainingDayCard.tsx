import { type LocalizedDisplayName } from "@/common/types/LocalizedDisplayName";
import {
  type AgeGroupTag,
  type LevelTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import { type TrainingDayType } from "@/features/training/models/TrainingDay";
import { ChoiceChips } from "@/form/ChoiceChips";
import { SnapSliderInputField } from "@/form/SnapSliderInputField";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

type TrainingDayCardProps = {
  day: TrainingDayType;
  userLevel: LevelTag;
  ageGroup: AgeGroupTag;
  onChangePlace: (place: string) => void;
  onChangeDuration: (durationMinutes: number) => void;
};

// Adolescents choose from the adult durations.
const durationOptionsFor = (userLevel: LevelTag, ageGroup: AgeGroupTag) => {
  const options =
    WorkoutConstants.DURATION_OPTIONS[userLevel]?.[
      ageGroup === "ADOLESCENT" ? "ADULT" : ageGroup
    ] ?? WorkoutConstants.DEFAULT_DURATION_OPTIONS;

  return options.map((option) => ({
    value: option.value,
    label: option.label.toString(),
  }));
};

/** Place and duration of one selected training day. */
export const TrainingDayCard: FC<TrainingDayCardProps> = ({
  day,
  userLevel,
  ageGroup,
  onChangePlace,
  onChangeDuration,
}) => {
  const { t, i18n } = useTranslation();

  const durationOptions = durationOptionsFor(userLevel, ageGroup);
  const durationIndex = durationOptions.findIndex(
    (option) => option.value === day.duration,
  );

  const placeOptions = WorkoutConstants.TRAINING_PLACES.map((place) => {
    const displayName: LocalizedDisplayName = place.displayName;
    return {
      value: place.value,
      label: displayName[i18n.language] ?? displayName.default,
    };
  });

  return (
    <Box
      gap="m"
      padding="m"
      borderRadius="xl"
      borderWidth={1.5}
      borderColor="outlineVariant"
      backgroundColor="surfaceContainerLowest"
    >
      <Text variant="fieldLabel" accessibilityRole="header">
        {t(WorkoutConstants.WEEKDAY_TRAINING_KEYS[day.weekday])}
      </Text>
      <Box gap="s">
        <Text variant="small" color="onSurfaceVariant">
          {t("screens.trainingDays.whereDoYouWorkOut")}
        </Text>
        <ChoiceChips
          accessibilityLabel={t("screens.trainingDays.whereDoYouWorkOut")}
          options={placeOptions}
          value={day.place}
          onChange={onChangePlace}
        />
      </Box>
      <SnapSliderInputField
        startItem={Math.max(durationIndex, 0)}
        onChange={onChangeDuration}
        sliderOptions={durationOptions}
        descriptionText={t("screens.trainingDays.howManyMinutes")}
        accessibilityLabel={t("screens.trainingDays.howManyMinutes")}
      />
    </Box>
  );
};
