import { TagGroups } from "@/constants/tagGroups";
import {
  getDefaultPositionForSport,
  getPositionsForSport,
  shouldShowPositionQuestion,
} from "@/constants/sportPositions";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { SelectionInputField } from "@/form/SelectionInputField";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { useEffect, useEffectEvent } from "react";
import { useTranslation } from "react-i18next";
import { type AnamnesisQuestionProps } from "./AnamnesisQuestionProps";

export function PositionQuestion({
  tags,
  onChangeTag,
}: AnamnesisQuestionProps) {
  const { t } = useTranslation();
  const sport = useUserWorkoutStore((state) => state.workoutData.sport);

  const showSelector = shouldShowPositionQuestion(sport);
  const sportPositions = getPositionsForSport(sport);
  const currentPositions = tags[TagGroups.POSITION] ?? [];

  // Auto-set position for OTHER_SPORT or if nothing is selected for a single-position sport
  const setDefaultPosition = useEffectEvent(() => {
    if (!showSelector) {
      onChangeTag(TagGroups.POSITION, getDefaultPositionForSport(sport));
      return;
    }
    if (
      sportPositions &&
      sportPositions.length === 1 &&
      currentPositions.length === 0
    ) {
      onChangeTag(TagGroups.POSITION, getDefaultPositionForSport(sport));
    }
  });

  // Clear invalid position when sport changes
  const clearInvalidPosition = useEffectEvent(() => {
    if (!showSelector || !sportPositions) return;
    const validValues = sportPositions.map((p) => p.value);
    const hasInvalidSelection = currentPositions.some(
      (pos) => !validValues.includes(pos),
    );
    if (hasInvalidSelection) {
      onChangeTag(TagGroups.POSITION, []);
    }
  });

  useEffect(() => {
    setDefaultPosition();
    clearInvalidPosition();
  }, [sport]);

  if (!showSelector) {
    return null;
  }

  const items = (sportPositions ?? []).map((pos) => ({
    value: pos.value,
    displayName: {
      default: t(pos.translationKey) as string,
    },
  }));

  return (
    <AnamnesisQuestionContainer
      title={{ default: t("anamnesisQuestions.position.title") }}
      description={{ default: t("anamnesisQuestions.position.description") }}
    >
      <SelectionInputField
        onChange={(value) => onChangeTag(TagGroups.POSITION, value as string[])}
        iconName="locate"
        selectedItems={currentPositions}
        items={items}
        singleSelection={true}
      />
    </AnamnesisQuestionContainer>
  );
}
