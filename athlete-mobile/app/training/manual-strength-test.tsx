import { WorkoutConstants } from "@/constants/workoutConstants";
import { TextInputField } from "@/form/TextInputField";
import { PowerTest } from "@/features/statistics/components/PowerTest";
import { type MaxValuesType } from "@/schemas/user.schema";
import {
  applyMaxValueToDirections,
  calculateAdjustedMaxValues,
  maxWeightByEpley,
} from "@/features/training/utils/workoutUtils";
import { Logger } from "@/services/Logger";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { formatDateToISO } from "@/utils/date";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { BackHeader } from "@/common/BackHeader";
import { Stack, useRouter } from "expo-router";
import { type FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/common/Alert";
import { ScrollView, TouchableOpacity } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type EquipmentType = "barbell" | "dumbbells";

interface ExerciseInput {
  weight: string;
  reps: string;
  equipment: EquipmentType;
}

interface ExerciseConfig {
  label: string;
  color: string;
  directions: string[];
}

const createEmptyInput = (): ExerciseInput => ({
  weight: "",
  reps: "",
  equipment: "barbell",
});

const ManualStrengthTestScreen: FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { saveMaxValues } = useUserWorkoutStore();
  const { addTestResult } = useExerciseProgressStore();
  const workoutMaxValues = useUserWorkoutStore(
    (state) => state.workoutData.maxValues,
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [inputs, setInputs] = useState<Record<string, ExerciseInput>>({
    squat: createEmptyInput(),
    benchPress: createEmptyInput(),
    rowing: createEmptyInput(),
    shoulderPress: createEmptyInput(),
  });

  const exercises: Record<string, ExerciseConfig> = useMemo(
    () => ({
      squat: {
        label: t("training.manualStrengthTest.squat"),
        color: colors.squad,
        directions: WorkoutConstants.STRENGTH_TEST_DIRECTIONS.squad,
      },
      benchPress: {
        label: t("training.manualStrengthTest.benchPress"),
        color: colors.benchPress,
        directions: WorkoutConstants.STRENGTH_TEST_DIRECTIONS.bench_press,
      },
      rowing: {
        label: t("training.manualStrengthTest.rowing"),
        color: colors.rowing,
        directions: WorkoutConstants.STRENGTH_TEST_DIRECTIONS.rowing,
      },
      shoulderPress: {
        label: t("training.manualStrengthTest.shoulderPress"),
        color: colors.shoulderPress,
        directions: WorkoutConstants.STRENGTH_TEST_DIRECTIONS.shoulder_press,
      },
    }),
    [t, colors.squad, colors.benchPress, colors.rowing, colors.shoulderPress],
  );

  const updateInput = useCallback(
    (exercise: string, field: keyof ExerciseInput, value: string) => {
      setInputs((prev) => ({
        ...prev,
        [exercise]: { ...prev[exercise], [field]: value },
      }));
    },
    [],
  );

  const toggleEquipment = useCallback(
    (exercise: string, equipment: EquipmentType) => {
      setInputs((prev) => ({
        ...prev,
        [exercise]: { ...prev[exercise], equipment },
      }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    const filledExercises: {
      key: string;
      weight: number;
      reps: number;
      config: ExerciseConfig;
      equipment: EquipmentType;
    }[] = [];
    let hasIncomplete = false;

    for (const [key, input] of Object.entries(inputs)) {
      const hasWeight = input.weight.trim() !== "";
      const hasReps = input.reps.trim() !== "";

      if (hasWeight !== hasReps) {
        hasIncomplete = true;
        break;
      }

      if (hasWeight && hasReps) {
        const weight = Number.parseFloat(input.weight);
        const reps = Number.parseInt(input.reps, 10);

        if (
          !Number.isNaN(weight) &&
          !Number.isNaN(reps) &&
          weight > 0 &&
          reps > 0
        ) {
          filledExercises.push({
            key,
            weight,
            reps,
            config: exercises[key],
            equipment: input.equipment,
          });
        }
      }
    }

    if (hasIncomplete) {
      Alert.alert(t("training.manualStrengthTest.incompleteError"));
      return;
    }

    if (filledExercises.length === 0) {
      Alert.alert(t("training.manualStrengthTest.validationError"));
      return;
    }

    let updatedMaxValues: MaxValuesType = {
      ...workoutMaxValues,
      testDate: formatDateToISO(new Date()),
    };

    for (const exercise of filledExercises) {
      let effectiveWeight = exercise.weight;
      if (exercise.equipment === "dumbbells") {
        effectiveWeight = exercise.weight * 2 * 1.1;
      }

      const oneRepMax = maxWeightByEpley(effectiveWeight, exercise.reps);
      const result = calculateAdjustedMaxValues(oneRepMax);
      updatedMaxValues = applyMaxValueToDirections(
        updatedMaxValues,
        exercise.config.directions,
        result,
      );
    }

    try {
      saveMaxValues(updatedMaxValues);
      addTestResult(updatedMaxValues);
      setShowSuccess(true);
    } catch (error) {
      Logger.logError(error as Error);
      Alert.alert(t("common.error"));
    }
  }, [inputs, exercises, workoutMaxValues, saveMaxValues, addTestResult, t]);

  const renderEquipmentToggle = (exerciseKey: string) => {
    const input = inputs[exerciseKey];

    return (
      <Box flexDirection="row" gap="s" marginBottom="s">
        <TouchableOpacity
          onPress={() => toggleEquipment(exerciseKey, "barbell")}
          style={{ flex: 1 }}
          accessibilityRole="button"
          accessibilityState={{ selected: input.equipment === "barbell" }}
        >
          <Box
            paddingVertical="s"
            borderRadius="m"
            alignItems="center"
            backgroundColor={
              input.equipment === "barbell" ? "primary" : "lightGrey2"
            }
          >
            <Text
              variant="body"
              color={input.equipment === "barbell" ? "white" : "darkGrey3"}
            >
              {t("training.manualStrengthTest.barbell")}
            </Text>
          </Box>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => toggleEquipment(exerciseKey, "dumbbells")}
          style={{ flex: 1 }}
          accessibilityRole="button"
          accessibilityState={{ selected: input.equipment === "dumbbells" }}
        >
          <Box
            paddingVertical="s"
            borderRadius="m"
            alignItems="center"
            backgroundColor={
              input.equipment === "dumbbells" ? "primary" : "lightGrey2"
            }
          >
            <Text
              variant="body"
              color={input.equipment === "dumbbells" ? "white" : "darkGrey3"}
            >
              {t("training.manualStrengthTest.dumbbells")}
            </Text>
          </Box>
        </TouchableOpacity>
      </Box>
    );
  };

  const renderExerciseSection = (exerciseKey: string) => {
    const config = exercises[exerciseKey];
    const input = inputs[exerciseKey];

    return (
      <Box
        key={exerciseKey}
        marginBottom="l"
        testID={`manual-test-${exerciseKey}`}
      >
        <Text
          variant="subtitle"
          marginBottom="s"
          style={{ color: config.color }}
        >
          {config.label}
        </Text>

        {renderEquipmentToggle(exerciseKey)}

        <Box flexDirection="row" gap="s">
          <Box flex={1}>
            <TextInputField
              value={input.weight}
              placeholder={t("training.manualStrengthTest.weightPlaceholder")}
              awesomeIconName="balance-scale"
              onChange={(value) => updateInput(exerciseKey, "weight", value)}
              keyboardType="numeric"
            />
          </Box>
          <Box flex={1}>
            <TextInputField
              value={input.reps}
              placeholder={t("training.manualStrengthTest.repsPlaceholder")}
              awesomeIconName="hashtag"
              onChange={(value) => updateInput(exerciseKey, "reps", value)}
              keyboardType="number-pad"
            />
          </Box>
        </Box>
      </Box>
    );
  };

  const handleGoOn = useCallback(() => {
    router.back();
  }, [router]);

  if (showSuccess) {
    return (
      <>
        <Stack.Screen
          options={{
            title: t("training.success.title"),
            headerLeft: () => null,
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
        <Box flex={1} backgroundColor="white">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <Box flex={1} padding="m">
              <PowerTest isSuccessScreen={true} />
            </Box>
          </ScrollView>

          <Box padding="l">
            <Button
              variant="primary"
              onPress={handleGoOn}
              testID="manual-test-go-on-button"
              style={{ marginBottom: insets.bottom }}
            >
              {t("training.success.goOn")}
            </Button>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("training.manualStrengthTest.title"),
          headerLeft: () => <BackHeader />,
        }}
      />
      <Box flex={1} backgroundColor="white">
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 16 }}
        >
          <Text variant="body" color="darkGrey2" marginBottom="l">
            {t("training.manualStrengthTest.description")}
          </Text>

          {Object.keys(exercises).map((key) => renderExerciseSection(key))}
        </KeyboardAwareScrollView>

        <Box padding="l">
          <Button
            variant="primary"
            onPress={handleSave}
            testID="manual-test-save-button"
            style={{ marginBottom: insets.bottom }}
          >
            {t("training.manualStrengthTest.save")}
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default ManualStrengthTestScreen;
