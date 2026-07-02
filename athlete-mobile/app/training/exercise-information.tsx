import { BodyPartsTagChips } from "@/bodyParts/BodyPartsTagChips";
import { expandMuscleTags } from "@/bodyParts/muscleTagMapping";
import { Loading } from "@/common/Loading";
import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { getExerciseById } from "@/data/exerciseRegistry";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { getTagValues } from "@/utils/tagUtils";
import { VideoPlayer } from "@/video/VideoPlayer";
import { Stack, useLocalSearchParams } from "expo-router";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenParams = {
  exerciseId: string;
};

/**
 * Exercise Information Screen
 *
 * Displays detailed exercise info: video, equipment, muscles, and instructions.
 * Accessible from training overview and active training screens.
 * Legacy: views/training/ExerciseInformation
 */
export default function ExerciseInformationScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<
    "/training/exercise-information",
    ScreenParams
  >();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);

  const exerciseIdParam = params.exerciseId;
  const exerciseId =
    typeof exerciseIdParam === "string" ? exerciseIdParam : undefined;
  const exercise = exerciseId ? getExerciseById(exerciseId) : undefined;
  const displayName = (exercise?.displayName || exercise?.name) ?? "";
  const video = exercise?.video;

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: displayName,
        }}
      />

      <Box flex={1} style={{ paddingBottom: insets.bottom }}>
        {exercise && video && (
          <VideoPlayer title={displayName} source={video} />
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          {exercise && (
            <>
              <EquipmentList tags={exercise.tags} />
              <MusclesList tags={exercise.tags} />
              <DescriptionsList description={exercise.description} />
            </>
          )}
        </ScrollView>

        <Loading
          show={isLoading}
          text={t("training.exerciseInformation.loading")}
        />
      </Box>
    </>
  );
}

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
          {/* \u2022 is unicode for bullet point */}
          {`\u2022 ${eq}`}
        </Text>
      ))}
    </Box>
  );
};

type MusclesListProps = {
  tags: string[];
};

const MusclesList: FC<MusclesListProps> = ({ tags }) => {
  const { t } = useTranslation();

  const musclesRaw = getTagValues(tags, TagGroups.MUSCLE);
  const musclesSecondaryRaw = getTagValues(tags, TagGroups.MUSCLE_SECONDARY);
  const muscles = expandMuscleTags(musclesRaw);
  const musclesSecondary = expandMuscleTags(musclesSecondaryRaw);

  if (muscles.length === 0) return null;

  return (
    <Box padding="l" testID="muscles-trained-section">
      <Text variant="cardTitle" marginBottom="s">
        {t("training.exerciseInformation.musclesTrained")}
      </Text>

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

type DescriptionsListProps = {
  description: string | null;
};

const DescriptionsList: FC<DescriptionsListProps> = ({ description }) => {
  const { t } = useTranslation();

  const descriptions = description?.split("\n");

  return (
    <Box padding="l" borderTopWidth={1} borderTopColor="lightGrey1">
      <Text variant="cardTitle" marginBottom="s">
        {t("training.exerciseInformation.exerciseHints")}
      </Text>
      {descriptions?.map((desc, i) => (
        <Text key={`description_${i}`} variant="body" marginBottom="xs">
          {/* \u2022 is unicode for bullet point */}
          {`\u2022 ${desc}`}
        </Text>
      ))}
    </Box>
  );
};
