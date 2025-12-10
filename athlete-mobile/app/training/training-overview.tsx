import { WorkoutConstants } from "@/constants/workoutConstants";
import type { ExerciseType } from "@/features/training/models/Exercise";
import { SkillType } from "@/features/training/models/Training";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { useTrainingStore } from "@/features/training/trainingStore";
import { useExercisesStore } from "@/store/exercisesStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ImageSource,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
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
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [trainingEquipment, setTrainingEquipment] = useState<string[]>([]);
  const [trainingExerciseList, setTrainingExerciseList] = useState<
    SkillGroup[]
  >([]);

  // Get store data
  const { exerciseList, setTrainingStartTime } = useTrainingStore();
  const { exercises } = useExercisesStore();

  // Process exercise data on mount
  const processExerciseData = useCallback(() => {
    if (!exerciseList || !exercises) return;

    const equipment: string[] = [];
    const processedExercises: UserExerciseDataType[] = [];

    // Collect unique equipment and valid exercises
    for (const userExercise of exerciseList) {
      if (userExercise.exerciseId === 999999) continue;

      const exercise = exercises.find((e) => e.id === userExercise.exerciseId);
      if (!exercise) continue;

      // Extract equipment tags
      const equipmentTags = exercise.tags.filter((tag) =>
        tag.startsWith("EQUIPMENT_"),
      );
      equipmentTags.forEach((tag) => {
        if (!equipment.includes(tag)) {
          equipment.push(tag);
        }
      });

      processedExercises.push(userExercise);
    }

    setTrainingEquipment(equipment);

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
  }, [exerciseList, exercises]);

  // Build exercise overview on mount
  useEffect(() => {
    if (!exerciseList || !exercises) {
      console.error("Missing exerciseList or exercises data");
      return;
    }

    processExerciseData();
  }, [exerciseList, exercises, processExerciseData]);

  const handleStartTraining = useCallback(() => {
    setTrainingStartTime(Date.now());
    router.push({
      pathname: "/training/training-active",
      params: params,
    });
  }, [router, params, setTrainingStartTime]);

  const handleShowExerciseInfo = useCallback(
    (exerciseId: number) => {
      router.push({
        pathname: "/training/exercise-information",
        params: { exerciseId },
      });
    },
    [router],
  );

  return (
    <>
      <Stack.Screen options={{ title: t("training.overview.title") }} />
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
              exercises={exercises || []}
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
  onShowExerciseInfo: (exerciseId: number) => void;
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
  onShowExerciseInfo: (exerciseId: number) => void;
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
        {t(`training.skill.${skillGroup.skill as SkillType}`, {
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
  onShowExerciseInfo: (exerciseId: number) => void;
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
  onShowExerciseInfo: (exerciseId: number) => void;
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
  const exerciseData = exercises.find((e) => e.id === exercise.exerciseId);
  if (!exerciseData) return null;

  // TODO: Missing exercise images. To be discussed further in Q&A session.
  // See: https://github.com/sports-athletics/sports-athletic/issues/105
  const source: ImageSource = {
    uri:
      Platform.select({ ios: "", android: "file://" }) + exerciseData.picture,
  };
  return (
    <Pressable onPress={onPress}>
      <Box flexDirection="row" marginBottom="m">
        {exerciseData.picture && (
          <Box
            borderStyle={"dashed"}
            borderWidth={1}
            borderColor={"darkGrey1"}
            borderRadius={"s"}
            width={120}
            marginRight={"s"}
          >
            <Image
              source={source}
              style={{
                width: 120,
                aspectRatio: 1,
              }}
              accessibilityLabel={exerciseData.displayName}
            />
          </Box>
        )}
        <Box flex={1} justifyContent="center">
          <Text variant="body">{exerciseData.displayName}</Text>
          <ExerciseValues exercise={exercise} />
        </Box>
      </Box>
    </Pressable>
  );
};

type ExerciseValuesProps = {
  exercise: UserExerciseDataType;
};

const ExerciseValues: FC<ExerciseValuesProps> = ({ exercise }) => {
  const { t } = useTranslation();

  const hasRepetition = typeof exercise.repetition !== "undefined";

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
      {exercise.weight && (
        <Text variant="small" marginTop="xs">
          {t("training.overview.kilos", {
            weight: exercise.weight.toFixed(2),
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
