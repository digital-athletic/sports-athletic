import { BodyParts } from "@/bodyParts/BodyParts";
import { BodyPartsTagChips } from "@/bodyParts/BodyPartsTagChips";
import { MuscleType } from "@/bodyParts/types";
import { Loading } from "@/common/Loading";
import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { useExercisesStore } from "@/store/exercisesStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { getTagValues } from "@/utils/tagUtils";
import { VideoPlayer } from "@/video/VideoPlayer";
import { Stack, useLocalSearchParams } from "expo-router";
import { FC, useEffect, useState } from "react";
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

  const { personalData } = useUserProfileStore();
  const { getExerciseById } = useExercisesStore();

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
              <MusclesList tags={exercise.tags} gender={personalData.gender} />
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

  // Filter out non-equipment tags
  const equipment = getTagValues(tags, TagGroups.EQUIPMENT).filter(
    // some EQ_ tags don't relate to training equipment
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
  gender: "MALE" | "FEMALE";
};

const MusclesList: FC<MusclesListProps> = ({ tags, gender }) => {
  const { t } = useTranslation();

  const muscles = getTagValues(tags, TagGroups.MUSCLE) as MuscleType[];
  const musclesSecondary = getTagValues(
    tags,
    TagGroups.MUSCLE_SECONDARY,
  ) as MuscleType[];

  if (muscles.length === 0) return null;

  return (
    <Box padding="l">
      <Text variant="cardTitle" marginBottom="s">
        {t("training.exerciseInformation.musclesTrained")}
      </Text>

      <Box flexDirection="row" justifyContent="space-around" marginBottom="l">
        <Box flex={1}>
          <BodyParts
            type="MUSCLE"
            gender={gender === "MALE" ? "m" : "w"}
            tags={muscles}
            secondaryTags={musclesSecondary}
            side="FRONT"
            showChips={false}
            hideCoaching
          />
        </Box>
        <Box flex={1}>
          <BodyParts
            type="MUSCLE"
            gender={gender === "MALE" ? "m" : "w"}
            tags={muscles}
            secondaryTags={musclesSecondary}
            side="BACK"
            showChips={false}
            hideCoaching
          />
        </Box>
      </Box>

      <Box paddingHorizontal="l" marginBottom="m">
        <Text variant="body" color="primary" marginBottom="xs">
          {t("training.exerciseInformation.legendActiveMuscles")}
        </Text>
        <Text variant="body" color="primary" opacity={0.5}>
          {t("training.exerciseInformation.legendSupportingMuscles")}
        </Text>
      </Box>

      <BodyPartsTagChips tags={muscles} />
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
