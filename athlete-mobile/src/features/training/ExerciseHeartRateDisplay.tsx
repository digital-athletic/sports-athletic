import { TagGroups } from "@/constants/tagGroups";
import { heartRateBySkillAndBirthday } from "@/features/training/utils/heartRateUtils";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { Text } from "@/theme/Text";
import { getTagValues } from "@/utils/tagUtils";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  exerciseData: ExerciseType | undefined;
  birthday: string;
};

export const ExerciseHeartRateDisplay: FC<Props> = ({
  exerciseData,
  birthday,
}) => {
  const { t } = useTranslation();

  if (!exerciseData) {
    return null;
  }

  const [cardioSkill] = getTagValues(exerciseData.tags, TagGroups.SKILL).filter(
    (skill) => skill.includes("CARDIO") && skill !== "CARDIO",
  );

  if (typeof cardioSkill === "undefined") {
    return null;
  }

  const heartRateInterval = heartRateBySkillAndBirthday(cardioSkill, birthday);

  if (typeof heartRateInterval === "undefined") {
    return null;
  }

  return (
    <>
      <Text variant="largeTitle">
        {`${heartRateInterval.low} - ${heartRateInterval.high}`}
      </Text>
      <Text variant="small" color="darkGrey1">
        {t("training.active.heartRateInterval")}
      </Text>
    </>
  );
};
