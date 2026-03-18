import { BackHeader } from "@/common/BackHeader";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { getAllExercises } from "@/data/exerciseRegistry";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { useTrainingStore } from "@/features/training/trainingStore";
import { getEquipmentList } from "@/features/training/trainingUtils";
import { deriveWeightForExercise } from "@/features/training/utils/workoutUtils";
import { MediaSkeleton } from "@/media/MediaSkeleton";
import { getExercisePictureUrl } from "@/services/StorageService";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Training Overview Screen
 *
 * Overview of the training session before starting.
 * Legacy: views/training/TrainingOverview
 */
export default function TrainingOverviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ weekday?: string; place?: string }>();
  const insets = useSafeAreaInsets();

  const [trainingEquipment, setTrainingEquipment] = useState<string[]>([]);
  const [trainingExerciseList, setTrainingExerciseList] = useState<
    SkillGroup[]
  >([]);

  // Get store data
  const { exerciseList, setTrainingStartTime } = useTrainingStore();
  const exercises = getAllExercises();
  const { trainingDays } = useTrainingScheduleStore();

  // Get place from params or derive from weekday
  const weekdayNumber = params.weekday ? parseInt(params.weekday) : undefined;
  const place =
    params.place ??
    (weekdayNumber !== undefined
      ? (trainingDays[weekdayNumber]?.place ?? "HOME")
      : "HOME");

  const handleBack = useCallback(() => {
    router.back();
    return true;
  }, [router]);

  // Process exercise data on mount
  const processExerciseData = useCallback(() => {
    if (!exerciseList) return;

    // Collect equipment using utility function
    const equipment = getEquipmentList(exerciseList, exercises, place);
    setTrainingEquipment(equipment);

    // Filter valid exercises for display
    const processedExercises: UserExerciseDataType[] = exerciseList.filter(
      (userExercise) =>
        userExercise.exerciseId !== "999999" &&
        exercises.some((e) => e.id === userExercise.exerciseId),
    );

    // Build exercise list grouped by skill
    const exList: SkillGroup[] = [];
    let currentSkill: string | undefined;

    for (let i = 0; i < processedExercises.length; i++) {
      const exercise = processedExercises[i];
      const previousExercise = i > 0 ? processedExercises[i - 1] : null;

      // Group by skill
      if (!currentSkill || exercise.skill !== currentSkill) {
        currentSkill = exercise.skill;
        exList.push({
          skill: currentSkill,
          sets: [],
        });
      }

      const previousExerciseData = previousExercise
        ? exercises.find((e) => e.id === previousExercise.exerciseId)
        : null;

      const previousOtherSideExerciseId =
        previousExerciseData?.otherSideExerciseId;

      // Check if new set
      if (
        i === 0 ||
        (exercise.set?.[0] === 1 &&
          previousExercise?.set?.[0] === previousExercise?.set?.[1] &&
          !(
            previousOtherSideExerciseId &&
            previousOtherSideExerciseId === exercise.exerciseId
          ))
      ) {
        exList[exList.length - 1].sets.push({
          length: exercise.set?.[1] || 1,
          exercises: [],
        });
      }

      const skillGroupIndex = exList.length - 1;
      const setIndex = exList[skillGroupIndex].sets.length - 1;

      if (setIndex !== -1) {
        const setExercises = exList[skillGroupIndex].sets[setIndex].exercises;
        const existingIndex = setExercises.findIndex(
          (e) => e.exerciseId === exercise.exerciseId,
        );

        if (existingIndex === -1) {
          setExercises.push(exercise);
        } else {
          setExercises[existingIndex] = exercise;
        }
      }
    }
    setTrainingExerciseList(exList);
  }, [exerciseList, exercises, place]);

  const handleStartTraining = useCallback(() => {
    setTrainingStartTime(Date.now());
    router.push({
      pathname: "/training/training-active",
      params: params,
    });
  }, [router, params, setTrainingStartTime]);

  const handleShowExerciseInfo = useCallback(
    (exerciseId: string) => {
      router.push({
        pathname: "/training/exercise-information",
        params: { exerciseId },
      });
    },
    [router],
  );

  // Build exercise overview on mount
  useEffect(() => {
    if (!exerciseList) {
      return;
    }

    processExerciseData();
  }, [exerciseList, processExerciseData]);

  // Show loading state when data isn't ready
  if (!exerciseList) {
    return (
      <>
        <Stack.Screen
          options={{
            title: t("training.overview.title"),
            headerLeft: () => <BackHeader onBack={handleBack} />,
          }}
        />
        <Box
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="white"
        >
          <Text variant="title">{t("common.loading")}</Text>
        </Box>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("training.overview.title"),
          headerLeft: () => <BackHeader onBack={handleBack} />,
        }}
      />
      <Box
        flex={1}
        backgroundColor="white"
        style={{ paddingBottom: insets.bottom }}
      >
        <ScrollView>
          <Box padding="l">
            <EquipmentSection equipment={trainingEquipment} />
            <ExercisesSection
              exList={trainingExerciseList}
              exercises={exercises}
              onShowExerciseInfo={handleShowExerciseInfo}
            />
          </Box>
        </ScrollView>

        <Box
          paddingHorizontal="l"
          paddingVertical="m"
          borderTopWidth={1}
          borderTopColor="lightGrey1"
        >
          <Button onPress={handleStartTraining}>
            {t("training.overview.startTraining")}
          </Button>
        </Box>
      </Box>
    </>
  );
}

type ExerciseSet = {
  length: number;
  exercises: UserExerciseDataType[];
};

type SkillGroup = {
  skill: string;
  sets: ExerciseSet[];
};

type EquipmentSectionProps = {
  equipment: string[];
};

const EquipmentSection: FC<EquipmentSectionProps> = ({ equipment }) => {
  const { t } = useTranslation();

  const sortedEquipment = equipment
    .map(
      (key) =>
        WorkoutConstants.EQUIPMENT[
          key as keyof typeof WorkoutConstants.EQUIPMENT
        ] ?? key,
    )
    .map((name) => t(`equipment.items.${name}`))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  if (sortedEquipment.length === 0) return null;

  return (
    <Box marginBottom="l">
      <Text variant="title" marginBottom="m">
        {t("training.overview.equipmentNeeded")}
      </Text>
      {sortedEquipment.map((equip) => {
        return (
          <Text key={equip} variant="body" marginBottom="s">
            {equip}
          </Text>
        );
      })}
    </Box>
  );
};

type ExercisesSectionProps = {
  exList: SkillGroup[];
  exercises: ExerciseType[];
  onShowExerciseInfo: (exerciseId: string) => void;
};

const ExercisesSection: FC<ExercisesSectionProps> = ({
  exList,
  exercises,
  onShowExerciseInfo,
}) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Text variant="title" marginBottom="m">
        {t("training.overview.exerciseList")}
      </Text>
      {exList.map((skillGroup, skillIndex) => (
        <SkillGroupItem
          key={`skill-${skillIndex}`}
          skillGroup={skillGroup}
          exercises={exercises}
          onShowExerciseInfo={onShowExerciseInfo}
        />
      ))}
    </Box>
  );
};

type SkillGroupItemProps = {
  skillGroup: SkillGroup;
  exercises: ExerciseType[];
  onShowExerciseInfo: (exerciseId: string) => void;
};

const SkillGroupItem: FC<SkillGroupItemProps> = ({
  skillGroup,
  exercises,
  onShowExerciseInfo,
}) => {
  const { t } = useTranslation();

  const isMaxSkill = skillGroup.skill.includes("MAX");

  return (
    <Box marginBottom="l">
      <Text variant="subtitle" marginBottom="m">
        {t(`training.skill.${skillGroup.skill}`, {
          defaultValue: skillGroup.skill,
        })}
      </Text>
      {skillGroup.sets.map((set, setIndex) => (
        <ExerciseSetItem
          key={`set-${setIndex}`}
          set={set}
          exercises={exercises}
          isMaxSkill={isMaxSkill}
          onShowExerciseInfo={onShowExerciseInfo}
        />
      ))}
    </Box>
  );
};

type ExerciseSetItemProps = {
  set: ExerciseSet;
  exercises: ExerciseType[];
  isMaxSkill: boolean;
  onShowExerciseInfo: (exerciseId: string) => void;
};

const ExerciseSetItem: FC<ExerciseSetItemProps> = ({
  set,
  exercises,
  isMaxSkill,
  onShowExerciseInfo,
}) => {
  const { t } = useTranslation();

  const setLabel =
    set.length === 1
      ? t("training.overview.oneSet")
      : t("training.overview.setCount", { count: set.length });

  if (isMaxSkill) {
    return (
      <MaxSetContent
        set={set}
        exercises={exercises}
        setLabel={String(setLabel)}
        onShowExerciseInfo={onShowExerciseInfo}
      />
    );
  }

  return (
    <Box marginBottom="m">
      <Text variant="body" marginBottom="s">
        {setLabel}
      </Text>
      {set.exercises.map((exercise, exIndex) => (
        <ExerciseItem
          key={`exercise-${exIndex}`}
          exercise={exercise}
          exercises={exercises}
          onPress={() => onShowExerciseInfo(exercise.exerciseId)}
        />
      ))}
    </Box>
  );
};

type MaxSetContentProps = {
  set: ExerciseSet;
  exercises: ExerciseType[];
  setLabel: string;
  onShowExerciseInfo: (exerciseId: string) => void;
};

const MaxSetContent: FC<MaxSetContentProps> = ({
  set,
  exercises,
  setLabel,
  onShowExerciseInfo,
}) => {
  const { t } = useTranslation();

  if (set.exercises.length === 0) return null;

  const [maxExercise, ...supportExercises] = set.exercises;

  return (
    <Box marginBottom="m">
      <Text variant="body" marginBottom="s">
        {setLabel}
      </Text>
      <ExerciseItem
        exercise={maxExercise}
        exercises={exercises}
        onPress={() => onShowExerciseInfo(maxExercise.exerciseId)}
      />
      {supportExercises.length > 0 && (
        <Box marginLeft="l" marginTop="m">
          <Text variant="body" marginBottom="s">
            {t("training.overview.supportExercises")}
          </Text>
          {supportExercises.map((exercise, exIndex) => (
            <ExerciseItem
              key={`support-${exIndex}`}
              exercise={exercise}
              exercises={exercises}
              onPress={() => onShowExerciseInfo(exercise.exerciseId)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

type ExerciseItemProps = {
  exercise: UserExerciseDataType;
  exercises: ExerciseType[];
  onPress: () => void;
};

const ExerciseItem: FC<ExerciseItemProps> = ({
  exercise,
  exercises,
  onPress,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const exerciseData = exercises.find((e) => e.id === exercise.exerciseId);

  useEffect(() => {
    if (!exerciseData?.picture) return;

    const pictureFilename = exerciseData.picture.split("/").pop() ?? "";
    if (!pictureFilename) return;

    getExercisePictureUrl(pictureFilename).then(setImageUrl);
  }, [exerciseData?.picture]);

  if (!exerciseData) return null;

  return (
    <Pressable onPress={onPress}>
      <Box flexDirection="row" marginBottom="m">
        {exerciseData.picture && (
          <Box
            borderRadius={"s"}
            width={120}
            marginRight={"s"}
            overflow="hidden"
          >
            {imageUrl ? (
              <Image
                source={imageUrl}
                style={{
                  width: 120,
                  aspectRatio: 1,
                }}
                cachePolicy="disk"
                accessibilityLabel={exerciseData.displayName ?? undefined}
              />
            ) : (
              <MediaSkeleton width={120} aspectRatio={1} showRetry={false} />
            )}
          </Box>
        )}
        <Box flex={1} justifyContent="center">
          <Text variant="body">{exerciseData.displayName}</Text>
          <ExerciseValues exercise={exercise} exerciseData={exerciseData} />
        </Box>
      </Box>
    </Pressable>
  );
};

type ExerciseValuesProps = {
  exercise: UserExerciseDataType;
  exerciseData: ExerciseType;
};

const ExerciseValues: FC<ExerciseValuesProps> = ({
  exercise,
  exerciseData,
}) => {
  const { t } = useTranslation();
  const { workoutData } = useUserWorkoutStore();

  const hasRepetition = typeof exercise.repetition !== "undefined";

  const derivedWeight = exercise?.weight
    ? deriveWeightForExercise(
        exercise.weight,
        exercise.weightType,
        exerciseData,
        workoutData.maxValues,
      )
    : undefined;

  return (
    <Box marginTop="s">
      {hasRepetition ? (
        <Text variant="small">
          {exercise.repetition === -1
            ? t("training.overview.numberMax")
            : t("training.overview.repetitions", {
                count: exercise.repetition,
              })}
        </Text>
      ) : (
        <Text variant="small">
          {t("training.overview.seconds", { count: exercise.duration })}
        </Text>
      )}
      {typeof derivedWeight === "number" && (
        <Text variant="small" marginTop="xs">
          {t("training.overview.kilos", {
            weight: derivedWeight.toFixed(2),
          })}
        </Text>
      )}
      {exercise.height && (
        <Text variant="small" marginTop="xs">
          {t("training.overview.cmHigh", { height: exercise.height })}
        </Text>
      )}
    </Box>
  );
};
