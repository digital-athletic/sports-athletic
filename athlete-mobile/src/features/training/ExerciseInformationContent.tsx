import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { getTagValues } from "@/utils/tagUtils";
import { VideoPlayer } from "@/video/VideoPlayer";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { MusclesList } from "./MusclesList";

type ExerciseInformationContentProps = {
  exercise: ExerciseType;
  /** Pauses and locks the video, e.g. while its sheet is hidden. */
  videoDisabled?: boolean;
  fullScreenDisabled?: boolean;
};

/** Video, equipment, hints and muscles of one exercise. */
export const ExerciseInformationContent: FC<
  ExerciseInformationContentProps
> = ({ exercise, videoDisabled, fullScreenDisabled }) => {
  const displayName = exercise.displayName || exercise.name;

  return (
    <>
      {exercise.video && (
        <VideoPlayer
          title={displayName}
          source={exercise.video}
          disabled={videoDisabled}
          fullScreenDisabled={fullScreenDisabled}
        />
      )}
      <ExerciseInformationSections exercise={exercise} />
    </>
  );
};

/**
 * The info screen shows the video above its scroll area, so it renders the
 * sections without the video.
 */
export const ExerciseInformationSections: FC<{ exercise: ExerciseType }> = ({
  exercise,
}) => (
  <>
    <EquipmentList tags={exercise.tags} />
    <DescriptionsList description={exercise.description} />
    <MusclesList tags={exercise.tags} />
  </>
);

type EquipmentListProps = {
  tags: string[];
};

const EquipmentList: FC<EquipmentListProps> = ({ tags }) => {
  const { t } = useTranslation();

  // Filter out non-equipment tags (legacy naming issues)
  const equipment = getTagValues(tags, TagGroups.EQUIPMENT).filter(
    // KG - Exercise with body weight (Körpergewicht)
    // MED_BALL - Exercise with equipment (naming deluxe)
    // weightS - Exercise with weights (naming broke)
    (entry) => !["KG", "MED_BALL", "weightS"].includes(entry),
  );

  if (equipment.length === 0) return null;

  const equipList = equipment
    .map(
      (key) =>
        WorkoutConstants.EQUIPMENT[
          key as keyof typeof WorkoutConstants.EQUIPMENT
        ] ?? key,
    )
    .map((name) => t(`equipment.items.${name}`))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  return (
    <Box padding="l" borderTopWidth={1} borderTopColor="lightGrey1">
      <Text variant="cardTitle" marginBottom="s">
        {t("equipment.title")}
      </Text>
      {equipList.map((eq, i) => (
        <Text key={`equipment_${i}`} variant="body" marginBottom="xs">
          {/* • is unicode for bullet point */}
          {`• ${eq}`}
        </Text>
      ))}
    </Box>
  );
};

type DescriptionsListProps = {
  description: string | null;
};

const DescriptionsList: FC<DescriptionsListProps> = ({ description }) => {
  const { t } = useTranslation();

  const descriptions = description
    ?.split("\n")
    .filter((line) => line.trim() !== "");

  if (!descriptions || descriptions.length === 0) return null;

  return (
    <Box padding="l" borderTopWidth={1} borderTopColor="lightGrey1">
      <Text variant="cardTitle" marginBottom="s">
        {t("training.exerciseInformation.exerciseHints")}
      </Text>
      {descriptions.map((desc, i) => (
        <Text key={`description_${i}`} variant="body" marginBottom="xs">
          {/* • is unicode for bullet point */}
          {`• ${desc}`}
        </Text>
      ))}
    </Box>
  );
};
