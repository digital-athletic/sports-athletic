import { PainChipSelector } from "@/bodyParts/PainChipSelector";
import { TagGroups } from "@/constants/tagGroups";
import { isPainRegion } from "@/features/training/utils/painUtils";
import { type AnamnesisQuestionProps } from "./AnamnesisQuestionProps";

export function PainQuestion({ tags, onChangeTag }: AnamnesisQuestionProps) {
  // Stale values from the former muscle chip list are ignored by the generator
  // and are not shown as selections here; they drop out on the next change.
  const value = (tags[TagGroups.PAIN] || []).filter(isPainRegion);

  return (
    <PainChipSelector
      tags={value}
      onChange={(value) => onChangeTag(TagGroups.PAIN, value)}
    />
  );
}
