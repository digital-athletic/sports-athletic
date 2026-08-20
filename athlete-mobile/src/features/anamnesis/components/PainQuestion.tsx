import { PainChipSelector } from "@/bodyParts/PainChipSelector";
import { type MuscleType } from "@/bodyParts/types";
import { TagGroups } from "@/constants/tagGroups";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { useTranslation } from "react-i18next";
import { type AnamnesisQuestionProps } from "./AnamnesisQuestionProps";

export function PainQuestion({ tags, onChangeTag }: AnamnesisQuestionProps) {
  const { t } = useTranslation();

  const value = tags[TagGroups.PAIN] || [];

  return (
    <AnamnesisQuestionContainer
      title={{ default: t("anamnesisQuestions.pain.title") }}
    >
      <PainChipSelector
        tags={value as MuscleType[]}
        onChange={(value) => onChangeTag(TagGroups.PAIN, value as string[])}
      />
    </AnamnesisQuestionContainer>
  );
}
