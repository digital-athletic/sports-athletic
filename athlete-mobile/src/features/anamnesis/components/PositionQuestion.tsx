import { TagGroups } from "@/constants/tagGroups";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { SelectionInputField } from "@/form/SelectionInputField";
import { useTranslation } from "react-i18next";
import { type AnamnesisQuestionProps } from "./AnamnesisQuestionProps";

export function PositionQuestion({
  tags,
  onChangeTag,
}: AnamnesisQuestionProps) {
  const { t } = useTranslation();

  const value = tags[TagGroups.POSITION] || [];

  const items = [
    {
      value: "FIELD",
      displayName: {
        default: t("anamnesisQuestions.position.options.field"),
      },
    },
    {
      value: "GOAL",
      displayName: {
        default: t("anamnesisQuestions.position.options.goal"),
      },
    },
  ];

  return (
    <AnamnesisQuestionContainer
      title={{ default: t("anamnesisQuestions.position.title") }}
      description={{ default: t("anamnesisQuestions.position.description") }}
    >
      <SelectionInputField
        onChange={(value) => onChangeTag(TagGroups.POSITION, value as string[])}
        iconName="locate"
        selectedItems={value}
        items={items}
        singleSelection={true}
      />
    </AnamnesisQuestionContainer>
  );
}
