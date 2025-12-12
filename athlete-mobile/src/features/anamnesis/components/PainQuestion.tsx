import { BodyParts } from "@/bodyParts/BodyParts";
import { type Gender } from "@/bodyParts/types";
import { TagGroups } from "@/constants/tagGroups";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { useTranslation } from "react-i18next";
import { type AnamnesisQuestionProps } from "./AnamnesisQuestionProps";

export function PainQuestion({
  tags,
  personalData,
  onChangeTag,
}: AnamnesisQuestionProps) {
  const { t } = useTranslation();

  const value = tags[TagGroups.PAIN] || [];
  const gender: Gender = personalData?.gender === "MALE" ? "m" : "w";

  return (
    <AnamnesisQuestionContainer
      title={{ default: t("anamnesisQuestions.pain.title") }}
    >
      <BodyParts
        type="PAIN"
        gender={gender}
        tags={value as any}
        secondaryTags={[]}
        onChange={(value) => onChangeTag(TagGroups.PAIN, value as string[])}
        showChips={true}
        side="BACK"
      />
    </AnamnesisQuestionContainer>
  );
}
