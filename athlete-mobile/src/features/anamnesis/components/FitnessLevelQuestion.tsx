import { TagGroups } from "@/constants/tagGroups";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { SnapSliderInputField } from "@/form/SnapSliderInputField";
import { useTranslation } from "react-i18next";
import { type AnamnesisQuestionProps } from "./AnamnesisQuestionProps";

export function FitnessLevelQuestion({
  tags,
  onChangeTag,
}: AnamnesisQuestionProps) {
  const { t } = useTranslation();

  const value = tags[TagGroups.LEVEL] || [];

  const options = [
    {
      value: "BEGINNER",
      displayName: t("anamnesisQuestions.fitnessLevel.options.beginner"),
    },
    {
      value: "ADVANCED",
      displayName: t("anamnesisQuestions.fitnessLevel.options.advanced"),
    },
    {
      value: "PROFESSIONAL",
      displayName: t("anamnesisQuestions.fitnessLevel.options.professional"),
    },
  ];

  let valueIndex = 0;
  const items = options.map((entry, index) => {
    if (entry.value === value[0]) {
      valueIndex = index;
    }
    return { value: index, label: entry.displayName };
  });

  return (
    <AnamnesisQuestionContainer
      title={{ default: t("anamnesisQuestions.fitnessLevel.title") }}
      description={{
        default: t("anamnesisQuestions.fitnessLevel.description"),
      }}
    >
      <SnapSliderInputField
        startItem={valueIndex}
        sliderOptions={items}
        descriptionText=""
        accessibilityLabel={t("anamnesisQuestions.fitnessLevel.title")}
        onChange={(value) => {
          const selectedValue = options[value as number]?.value;
          if (selectedValue) {
            onChangeTag(TagGroups.LEVEL, [selectedValue]);
          }
        }}
      />
    </AnamnesisQuestionContainer>
  );
}
