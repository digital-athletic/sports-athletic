import { TagGroups } from "@/constants/tagGroups";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { ChoiceCards } from "@/form/ChoiceCards";
import { useTranslation } from "react-i18next";
import { type AnamnesisQuestionProps } from "./AnamnesisQuestionProps";

const LEVELS = [
  { value: "BEGINNER", key: "beginner" },
  { value: "ADVANCED", key: "advanced" },
  { value: "PROFESSIONAL", key: "professional" },
] as const;

export function FitnessLevelQuestion({
  tags,
  onChangeTag,
}: AnamnesisQuestionProps) {
  const { t } = useTranslation();

  // Without a stored level the plan uses beginner, so the cards show it too.
  const value = tags[TagGroups.LEVEL]?.[0] ?? LEVELS[0].value;

  const options = LEVELS.map((level) => ({
    value: level.value,
    label: t(`anamnesisQuestions.fitnessLevel.options.${level.key}`),
    description: t(
      `anamnesisQuestions.fitnessLevel.optionDescriptions.${level.key}`,
    ),
  }));

  return (
    <AnamnesisQuestionContainer
      title={{ default: t("anamnesisQuestions.fitnessLevel.title") }}
      description={{
        default: t("anamnesisQuestions.fitnessLevel.description"),
      }}
    >
      <ChoiceCards
        accessibilityLabel={t("anamnesisQuestions.fitnessLevel.title")}
        options={options}
        value={value}
        onChange={(level) => onChangeTag(TagGroups.LEVEL, [level])}
      />
    </AnamnesisQuestionContainer>
  );
}
