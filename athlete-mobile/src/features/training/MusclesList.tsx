import { BodyPartsTagChips } from "@/bodyParts/BodyPartsTagChips";
import { expandMuscleTags } from "@/bodyParts/muscleTagMapping";
import { TagGroups } from "@/constants/tagGroups";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { getTagValues } from "@/utils/tagUtils";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { ExerciseMuscleSilhouettePair } from "./ExerciseMuscleSilhouettePair";

type MusclesListProps = {
  tags: string[];
};

export const MusclesList: FC<MusclesListProps> = ({ tags }) => {
  const { t } = useTranslation();

  const musclesRaw = getTagValues(tags, TagGroups.MUSCLE);
  const musclesSecondaryRaw = getTagValues(tags, TagGroups.MUSCLE_SECONDARY);
  const muscles = expandMuscleTags(musclesRaw);
  const musclesSecondary = expandMuscleTags(musclesSecondaryRaw);

  if (muscles.length === 0) return null;

  return (
    <Box
      padding="l"
      borderTopWidth={1}
      borderTopColor="lightGrey1"
      testID="muscles-trained-section"
    >
      <Text variant="cardTitle" marginBottom="s">
        {t("training.exerciseInformation.musclesTrained")}
      </Text>

      <ExerciseMuscleSilhouettePair
        primaryTags={musclesRaw}
        secondaryTags={musclesSecondaryRaw}
      />

      <Text variant="body" color="primary" marginBottom="xs">
        {t("training.exerciseInformation.legendActiveMuscles")}
      </Text>
      <BodyPartsTagChips tags={muscles} />

      {musclesSecondary.length > 0 && (
        <>
          <Text variant="body" color="primary" opacity={0.5} marginTop="s">
            {t("training.exerciseInformation.legendSupportingMuscles")}
          </Text>
          <BodyPartsTagChips tags={musclesSecondary} />
        </>
      )}
    </Box>
  );
};
