import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { TextInputField } from "@/form/TextInputField";
import { useTranslation } from "react-i18next";
import { type AnamnesisQuestionProps } from "./AnamnesisQuestionProps";

export function HeightQuestion({
  values,
  onChangeValue,
}: AnamnesisQuestionProps) {
  const { t } = useTranslation();

  const value = (values.height as string) || "";

  return (
    <AnamnesisQuestionContainer
      title={{ default: t("anamnesisQuestions.height.title") }}
      description={{ default: t("anamnesisQuestions.height.description") }}
    >
      <TextInputField
        value={value}
        placeholder={t("anamnesisQuestions.height.placeholder")}
        iconName="resize"
        accessibilityLabel={t("anamnesisQuestions.height.title")}
        onChange={(value) => onChangeValue("height", value)}
      />
    </AnamnesisQuestionContainer>
  );
}
