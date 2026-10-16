import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { TextInputField } from "@/form/TextInputField";
import { useTranslation } from "react-i18next";
import { type AnamnesisQuestionProps } from "./AnamnesisQuestionProps";

export function WeightQuestion({
  values,
  onChangeValue,
}: AnamnesisQuestionProps) {
  const { t } = useTranslation();

  const value = (values.weight as string) || "";

  return (
    <AnamnesisQuestionContainer
      title={{ default: t("anamnesisQuestions.weight.title") }}
      description={{ default: t("anamnesisQuestions.weight.description") }}
    >
      <TextInputField
        value={value}
        placeholder={t("anamnesisQuestions.weight.placeholder")}
        iconName="scale"
        accessibilityLabel={t("anamnesisQuestions.weight.title")}
        onChange={(value) => onChangeValue("weight", value)}
      />
    </AnamnesisQuestionContainer>
  );
}
