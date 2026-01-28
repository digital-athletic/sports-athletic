import { BackHeader } from "@/common/BackHeader";
import { Loading } from "@/common/Loading";
import { ProgressBar } from "@/common/ProgressBar";
import { SkipHeader } from "@/common/SkipHeader";
import { TagGroups } from "@/constants/tagGroups";
import { AnamnesisGroup1 } from "@/features/anamnesis/AnamnesisGroup1";
import { AnamnesisGroup2 } from "@/features/anamnesis/AnamnesisGroup2";
import { AnamnesisGroup3 } from "@/features/anamnesis/AnamnesisGroup3";
import { useAnamnesisCompletion } from "@/features/anamnesis/useAnamnesisCompletion";
import { useShowSeasonPhaseAfterAnamnesis } from "@/features/anamnesis/useShowSeasonPhaseAfterAnamnesis";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrainingScheduleStore } from "../../../src/store/trainingScheduleStore";
import { useUserProfileStore } from "../../../src/store/userProfileStore";
import { useUserWorkoutStore } from "../../../src/store/userWorkoutStore";
import { Button } from "../../../src/theme/Button";

/**
 * Anamnesis Component
 * Displays questionnaire screens for gathering user health and training data.
 */
export default function AnamnesisQuestions() {
  const { t } = useTranslation();
  const router = useRouter();

  const { workoutData } = useUserWorkoutStore();
  const { personalData, anamnesisCompleted, setAnamnesisCompleted } =
    useUserProfileStore();
  const { clearTrainingSchedule } = useTrainingScheduleStore();

  const showSeasonPhaseAfterAnamnesis = useShowSeasonPhaseAfterAnamnesis();

  // Get state and actions from Zustand store
  const {
    values,
    tags,
    setValue,
    setTag,
    setSeasonPhase,
    setCompleted,
    saveData,
  } = useAnamnesisStore();

  const { saveAnamnesisData } = useAnamnesisCompletion();

  // Local state
  const [loading, setLoading] = useState(false);
  const [groupIndex, setGroupIndex] = useState(0);

  // Navigation handlers
  const onBack = useCallback(() => {
    if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      return true;
    } else {
      router.back();
      return true;
    }
  }, [groupIndex, router]);

  const finishAnamnesis = useCallback(async () => {
    setLoading(true);
    try {
      // Track prevention tag
      if (tags[TagGroups.PAIN] && tags[TagGroups.PAIN].length !== 0) {
        console.log("Anamnesis pains added:", tags[TagGroups.PAIN]);
      }

      setAnamnesisCompleted(true);
      await setCompleted();
      await saveAnamnesisData();
      await saveData();

      if (showSeasonPhaseAfterAnamnesis) {
        router.navigate("/(anamnesis)/anamnesis/season-phase");
      } else {
        setSeasonPhase(workoutData.seasonPhase);
        router.navigate("/(anamnesis)/anamnesis/generating");
      }
    } catch (e) {
      console.error("finish anamnesis error", e);
    }
    setLoading(false);
  }, [
    tags,
    setAnamnesisCompleted,
    setCompleted,
    saveData,
    saveAnamnesisData,
    showSeasonPhaseAfterAnamnesis,
    setSeasonPhase,
    workoutData.seasonPhase,
    router,
  ]);

  const goOn = useCallback(async () => {
    if (groupIndex + 1 < 3) {
      setGroupIndex(groupIndex + 1);
    } else {
      await finishAnamnesis();
    }
  }, [groupIndex, finishAnamnesis]);

  const onChangeValue = useCallback(
    (field: string, value: unknown) => {
      setValue(field, value as string | number | boolean);
    },
    [setValue],
  );

  const onChangeTag = useCallback(
    (tag: string, values: string[]) => {
      // Reset training days if level changed
      if (tag === TagGroups.LEVEL) {
        clearTrainingSchedule();
      }
      setTag(tag, values);
    },
    [setTag, clearTrainingSchedule],
  );

  // Setup hardware back button handler
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => handler.remove();
  }, [onBack]);

  const maxSteps = showSeasonPhaseAfterAnamnesis ? 6 : 4;
  const progress = 2 + groupIndex;

  // Get group title based on index
  const getGroupTitle = () => {
    switch (groupIndex) {
      case 0:
        return t("anamnesisQuestions.groups.heightWeight");
      case 1:
        return t("anamnesisQuestions.groups.positionFitness");
      case 2:
        return t("anamnesisQuestions.groups.pains");
      default:
        return "";
    }
  };

  const title = getGroupTitle();

  const questionProps = {
    values,
    tags,
    personalData,
    onChangeValue,
    onChangeTag,
  };

  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerLeft: () => <BackHeader onBack={onBack} />,
          headerRight: () => (
            <SkipHeader
              alertTitle="screens.anamnesis.abortQuestion"
              alertMessage={
                anamnesisCompleted
                  ? "screens.anamnesis.abortExplanation"
                  : "screens.anamnesis.abortIncomplete"
              }
            />
          ),
        }}
      />
      <Box
        flex={1}
        justifyContent="space-between"
        backgroundColor="lightGrey1"
        style={{ paddingBottom: insets.bottom }}
      >
        <ScrollBox flex={1}>
          <ProgressBar progress={progress} maximum={maxSteps} />
          {!loading && (
            <>
              {groupIndex === 0 && <AnamnesisGroup1 {...questionProps} />}
              {groupIndex === 1 && <AnamnesisGroup2 {...questionProps} />}
              {groupIndex === 2 && <AnamnesisGroup3 {...questionProps} />}
            </>
          )}
        </ScrollBox>
        <Button onPress={goOn} margin="m">
          {t("common.goOn")}
        </Button>
        <Loading text={t("common.saving")} show={loading} />
      </Box>
    </>
  );
}
