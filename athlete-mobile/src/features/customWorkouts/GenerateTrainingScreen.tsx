import { HeadlineScreen } from "@/common/HeadlineScreen";
import {
  buildGeneratedTemplate,
  type GeneratedTrainingFocus,
  type GeneratedTrainingRegion,
  listRegionsForFocus,
  TRAINING_TIMES,
  type TrainingTime,
} from "@/features/customWorkouts/buildGeneratedTemplate";
import { Chip } from "@/form/Chip";
import { ChoiceChips } from "@/form/ChoiceChips";
import {
  generateCustomWorkoutId,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { router } from "expo-router";
import { type FC, type PropsWithChildren, useState } from "react";
import { useTranslation } from "react-i18next";

const FOCUSES: GeneratedTrainingFocus[] = [
  "hypertrophy",
  "explosive",
  "mobility",
  "cardio",
];

const FormSection: FC<PropsWithChildren<{ label: string }>> = ({
  label,
  children,
}) => (
  <Box gap="s">
    <Text variant="body" fontWeight="700">
      {label}
    </Text>
    {children}
  </Box>
);

/** The full body stands for every region, so it replaces the other chips. */
const toggleRegion = (
  regions: GeneratedTrainingRegion[],
  region: GeneratedTrainingRegion,
): GeneratedTrainingRegion[] => {
  if (regions.includes(region)) {
    return regions.filter((selected) => selected !== region);
  }
  if (region === "fullBody") return ["fullBody"];
  return [...regions.filter((selected) => selected !== "fullBody"), region];
};

type TrainingForm = {
  minutes: TrainingTime | null;
  focus: GeneratedTrainingFocus | null;
  regions: GeneratedTrainingRegion[];
  offeredRegions: GeneratedTrainingRegion[];
  isComplete: boolean;
  changeMinutes: (value: string) => void;
  changeFocus: (value: string) => void;
  toggleRegion: (region: GeneratedTrainingRegion) => void;
  generate: () => void;
};

/** State of the form. Generating saves the training and closes the screen. */
const useTrainingForm = (): TrainingForm => {
  const [minutes, setMinutes] = useState<TrainingTime | null>(null);
  const [focus, setFocus] = useState<GeneratedTrainingFocus | null>(null);
  const [regions, setRegions] = useState<GeneratedTrainingRegion[]>([]);

  const offeredRegions = focus ? listRegionsForFocus(focus) : [];
  const isComplete =
    minutes !== null &&
    focus !== null &&
    (offeredRegions.length === 0 || regions.length > 0);

  return {
    minutes,
    focus,
    regions,
    offeredRegions,
    isComplete,
    changeMinutes: (value) =>
      setMinutes(TRAINING_TIMES.find((time) => String(time) === value) ?? null),
    changeFocus: (value) => {
      const next = FOCUSES.find((candidate) => candidate === value);
      if (!next) return;
      const offered = listRegionsForFocus(next);
      setFocus(next);
      setRegions(regions.filter((region) => offered.includes(region)));
    },
    toggleRegion: (region) => setRegions(toggleRegion(regions, region)),
    generate: () => {
      if (minutes === null || focus === null || !isComplete) return;
      const template = buildGeneratedTemplate(
        { minutes, focus, regions },
        generateCustomWorkoutId(),
      );
      useCustomWorkoutsStore.getState().saveCustomWorkout(template, null);
      router.back();
    },
  };
};

/**
 * Form that generates a custom training from a time, a focus and regions,
 * saves it under "Your trainings" and returns to that list.
 */
export default function GenerateTrainingScreen() {
  const { t } = useTranslation();
  const form = useTrainingForm();

  return (
    <HeadlineScreen
      title={t("screens.home.generateTraining.title")}
      heading={t("screens.home.generateTraining.title")}
      description={t("screens.home.generateTraining.subtitle")}
      action={{
        label: t("screens.home.generateTraining.generate"),
        onPress: form.generate,
        disabled: !form.isComplete,
      }}
    >
      <Box gap="l">
        <FormSection label={t("screens.home.generateTraining.time")}>
          <ChoiceChips
            accessibilityLabel={t("screens.home.generateTraining.time")}
            options={TRAINING_TIMES.map((time) => ({
              value: String(time),
              label: t("screens.home.generateTraining.minutes", {
                minutes: time,
              }),
            }))}
            value={form.minutes === null ? null : String(form.minutes)}
            onChange={form.changeMinutes}
          />
        </FormSection>
        <FormSection label={t("screens.home.generateTraining.focus")}>
          <ChoiceChips
            accessibilityLabel={t("screens.home.generateTraining.focus")}
            options={FOCUSES.map((value) => ({
              value,
              label: t(`screens.home.generateTraining.focuses.${value}`),
            }))}
            value={form.focus}
            onChange={form.changeFocus}
          />
        </FormSection>
        {form.offeredRegions.length > 0 && (
          <FormSection label={t("screens.home.generateTraining.regions")}>
            <Box flexDirection="row" flexWrap="wrap" gap="s">
              {form.offeredRegions.map((region) => (
                <Chip
                  key={region}
                  label={t(
                    `screens.home.generateTraining.regionNames.${region}`,
                  )}
                  selected={form.regions.includes(region)}
                  onPress={() => form.toggleRegion(region)}
                />
              ))}
            </Box>
          </FormSection>
        )}
      </Box>
    </HeadlineScreen>
  );
}
