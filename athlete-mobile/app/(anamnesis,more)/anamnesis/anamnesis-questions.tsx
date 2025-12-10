import { BodyParts } from "@/bodyParts/BodyParts";
import { BodyPartType, Gender } from "@/bodyParts/types";
import { type FontAwesomeIconName } from "@/common/AwesomeIcon";
import { BackHeader } from "@/common/BackHeader";
import { Loading } from "@/common/Loading";
import { ProgressBar } from "@/common/ProgressBar";
import { SkipHeader } from "@/common/SkipHeader";
import { TagGroups } from "@/constants/tagGroups";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { DateInputField } from "@/form/DateInputField";
import { EmailInputField } from "@/form/EmailInputField";
import { PasswordInputField } from "@/form/PasswordInputField";
import { SelectionInputField } from "@/form/SelectionInputField";
import { SnapSliderInputField } from "@/form/SnapSliderInputField";
import { SwitchInputField } from "@/form/SwitchInputField";
import { TextInputField } from "@/form/TextInputField";
import {
  useAnamnesisStore,
  type AnamnesisQuestionType,
  type LocalizedText,
} from "@/store/anamnesisStore";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Route, Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler } from "react-native";
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
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { workoutData, setSeasonPhase } = useUserWorkoutStore();
  const {
    personalData,
    anamnesisCompleted,
    isInInitialAnamnesis,
    setIsInInitialAnamnesis,
    setAnamnesisCompleted,
  } = useUserProfileStore();
  const { trainingDays, resetToDefaults } = useTrainingScheduleStore();

  // Get state and actions from Zustand store
  const {
    questions,
    values,
    tags,
    originPath,
    setValue,
    setTag,
    setCompleted,
    saveData,
    resetData,
  } = useAnamnesisStore();

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

  const showClosePopup = useCallback(() => {
    let message = t("screens.anamnesis.abortIncomplete");
    if (anamnesisCompleted) {
      message = t("screens.anamnesis.abortExplanation");
    }

    Alert.alert(t("screens.anamnesis.abortQuestion"), message, [
      {
        text: t("common.yes"),
        onPress: async () => {
          if (isInInitialAnamnesis) {
            router.navigate({
              pathname: "/(tabs)/(more)/subscribe",
              params: { goOn: "/(tabs)/(home)" satisfies Route },
            });
            setIsInInitialAnamnesis(false);
          } else {
            if (originPath) router.navigate(originPath);
          }
          resetData();
        },
      },
      {
        text: t("common.no"),
      },
    ]);
  }, [
    t,
    anamnesisCompleted,
    isInInitialAnamnesis,
    resetData,
    router,
    setIsInInitialAnamnesis,
    originPath,
  ]);

  const finishAnamnesis = useCallback(async () => {
    setLoading(true);
    try {
      // Track prevention tag
      if (tags[TagGroups.PAIN] && tags[TagGroups.PAIN].length !== 0) {
        console.log("Anamnesis pains added:", tags[TagGroups.PAIN]);
      }

      setAnamnesisCompleted(true);
      await setCompleted();
      await saveData();

      let hasActiveTrainingDay = false;
      for (let day = 0; day < trainingDays.length; day++) {
        if (trainingDays[day].active) {
          hasActiveTrainingDay = true;
          break;
        }
      }

      if (
        hasActiveTrainingDay &&
        workoutData?.seasonPhase?.endDate &&
        workoutData?.seasonPhase?.type
      ) {
        setSeasonPhase(workoutData.seasonPhase);
        router.navigate("/(anamnesis)/anamnesis/generating");
      } else {
        // TODO: When coming from the more menu the originPath is not set here, so this doesn't trigger. This is as it was in the legacy flow.
        // if (originPath === "/(tabs)/more") {
        //   Alert.alert(
        //     t("screens.anamnesis.incompleteTitle"),
        //     t("screens.anamnesis.incompleteTrainingData"),
        //     [
        //       {
        //         text: t("common.ok"),
        //         onPress: () => {
        //           setLoading(false);
        //           router.navigate(originPath);
        //         },
        //       },
        //     ]
        //   );
        // } else {
        //   router.navigate("/anamnesis/season-phase");
        // }
        router.navigate("/(anamnesis)/anamnesis/season-phase");
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
    workoutData.seasonPhase,
    trainingDays,
    setSeasonPhase,
    router,
  ]);

  const goOn = useCallback(async () => {
    if (groupIndex + 1 < questions.length) {
      setGroupIndex(groupIndex + 1);
    } else {
      await finishAnamnesis();
    }
  }, [groupIndex, questions.length, finishAnamnesis]);

  const changeInput = useCallback(
    async (value: unknown, question: AnamnesisQuestionType) => {
      if (question.dataType === "tag" && question.tag) {
        // Reset training days if level changed
        if (question.tag === TagGroups.LEVEL) {
          resetToDefaults();
        }
        setTag(question.tag, value as string[]);
      } else if (question.dataField) {
        setValue(question.dataField, value);
      }
    },
    [setTag, setValue, resetToDefaults],
  );

  // Setup hardware back button handler
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => handler.remove();
  }, [onBack]);

  const getLocalizedText = (text: LocalizedText): string => {
    if (text[i18n.language]) {
      return text[i18n.language];
    }
    return text.default;
  };

  const renderTextInput = (question: AnamnesisQuestionType, i: number) => {
    let value = "";
    if (question.dataType === "tag" && question.tag) {
      const tagValue = tags[question.tag];
      value = Array.isArray(tagValue) ? tagValue[0] || "" : "";
    } else if (question.dataField) {
      value = (values[question.dataField] as string) || "";
    }

    const placeholder = getLocalizedText(question.placeholder);

    return (
      <AnamnesisQuestionContainer
        key={`question_${i}`}
        title={question.title}
        description={question.description}
      >
        <TextInputField
          value={value}
          placeholder={placeholder}
          awesomeIconName={question.icon as FontAwesomeIconName}
          onChange={(value) => changeInput(value, question)}
        />
      </AnamnesisQuestionContainer>
    );
  };

  const renderSelectInput = (
    question: AnamnesisQuestionType,
    i: number,
    multiple: boolean,
  ) => {
    let value: string[] = [];
    if (question.dataType === "tag" && question.tag) {
      value = tags[question.tag] || [];
    } else if (question.dataField) {
      const fieldValue = values[question.dataField];
      value = Array.isArray(fieldValue) ? fieldValue : [];
    }

    return (
      <AnamnesisQuestionContainer
        key={`question_${i}`}
        title={question.title}
        description={question.description}
      >
        <SelectionInputField
          onChange={(value) => changeInput(value, question)}
          awesomeIconName={question.icon as FontAwesomeIconName}
          selectedItems={value}
          items={(question.values || []).map((v) => ({
            value: v,
            displayName: { default: v },
          }))}
          singleSelection={!multiple}
        />
      </AnamnesisQuestionContainer>
    );
  };

  const renderSwitchInput = (question: AnamnesisQuestionType, i: number) => {
    let value = false;
    if (question.dataType === "tag" && question.tag) {
      const tagValue = tags[question.tag];
      value = Array.isArray(tagValue) ? tagValue.length > 0 : false;
    } else if (question.dataField) {
      value = Boolean(values[question.dataField]);
    }

    const description = question.description
      ? getLocalizedText(question.description)
      : "";

    return (
      <AnamnesisQuestionContainer
        key={`question_${i}`}
        title={question.title}
        description={question.description}
      >
        <SwitchInputField
          value={value}
          descriptionText={description}
          onChange={(value) => changeInput(value, question)}
        />
      </AnamnesisQuestionContainer>
    );
  };

  const renderEmailInput = (question: AnamnesisQuestionType, i: number) => {
    let value = "";
    if (question.dataType === "tag" && question.tag) {
      const tagValue = tags[question.tag];
      value = Array.isArray(tagValue) ? tagValue[0] || "" : "";
    } else if (question.dataField) {
      value = (values[question.dataField] as string) || "";
    }

    return (
      <AnamnesisQuestionContainer
        key={`question_${i}`}
        title={question.title}
        description={question.description}
      >
        <EmailInputField
          onChange={(value) => changeInput(value, question)}
          email={value}
        />
      </AnamnesisQuestionContainer>
    );
  };

  const renderPasswordInput = (question: AnamnesisQuestionType, i: number) => {
    let value = "";
    if (question.dataType === "tag" && question.tag) {
      const tagValue = tags[question.tag];
      value = Array.isArray(tagValue) ? tagValue[0] || "" : "";
    } else if (question.dataField) {
      value = (values[question.dataField] as string) || "";
    }

    return (
      <AnamnesisQuestionContainer
        key={`question_${i}`}
        title={question.title}
        description={question.description}
      >
        <PasswordInputField
          onChange={(value) => changeInput(value, question)}
          password={value}
        />
      </AnamnesisQuestionContainer>
    );
  };

  const renderBodyPartsInput = (question: AnamnesisQuestionType, i: number) => {
    const type: BodyPartType =
      question.bodyPartType === "MUSCLE" ? "MUSCLE" : "PAIN";
    const gender: Gender = personalData?.gender === "MALE" ? "m" : "w";
    const value = question.tag ? tags[question.tag] || [] : [];

    return (
      <AnamnesisQuestionContainer
        key={`question_${i}`}
        title={question.title}
        description={question.description}
      >
        <BodyParts
          type={type}
          gender={gender}
          tags={value as any}
          secondaryTags={[]}
          onChange={(value) => changeInput(value, question)}
          showChips={true}
          side="BACK"
        />
      </AnamnesisQuestionContainer>
    );
  };

  const renderDateInput = (
    question: AnamnesisQuestionType,
    i: number,
    time: boolean,
  ) => {
    const currentDate = new Date();
    let value = time
      ? `${currentDate.getHours()}:${currentDate.getMinutes()}`
      : `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;

    if (question.dataType === "tag" && question.tag) {
      const tagValue = tags[question.tag];
      value = Array.isArray(tagValue) ? tagValue[0] || value : value;
    } else if (question.dataField) {
      value = (values[question.dataField] as string) || value;
    }

    return (
      <AnamnesisQuestionContainer
        key={`question_${i}`}
        title={question.title}
        description={question.description}
      >
        <DateInputField
          type={time ? "time" : "date"}
          dateTime={value}
          onChange={(value) => changeInput(value, question)}
        />
      </AnamnesisQuestionContainer>
    );
  };

  const renderSnapSliderInput = (
    question: AnamnesisQuestionType,
    i: number,
  ) => {
    let value: string[] = [];
    if (question.dataType === "tag" && question.tag) {
      value = tags[question.tag] || [];
    } else if (question.dataField) {
      const fieldValue = values[question.dataField];
      value = Array.isArray(fieldValue) ? fieldValue : [];
    }

    let valueIndex = 0;
    const items = (question.values || []).map((entry, index) => {
      if (entry === value[0]) {
        valueIndex = index;
      }
      return { value: index, label: entry };
    });

    return (
      <AnamnesisQuestionContainer
        key={`question_${i}`}
        title={question.title}
        description={question.description}
      >
        <SnapSliderInputField
          startItem={valueIndex}
          sliderOptions={items}
          descriptionText=""
          onChange={(value) => changeInput([String(value)], question)}
        />
      </AnamnesisQuestionContainer>
    );
  };

  const renderAnamnesisQuestions = () => {
    if (loading || !questions || questions.length === 0) {
      return null;
    }

    const currentQuestions = questions[groupIndex]?.questions || [];
    const views: React.ReactNode[] = [];

    for (let i = 0; i < currentQuestions.length; i++) {
      switch (currentQuestions[i].type) {
        case "text":
          views.push(renderTextInput(currentQuestions[i], i));
          break;
        case "select":
          views.push(renderSelectInput(currentQuestions[i], i, false));
          break;
        case "selectMultiple":
          views.push(renderSelectInput(currentQuestions[i], i, true));
          break;
        case "switch":
          views.push(renderSwitchInput(currentQuestions[i], i));
          break;
        case "email":
          views.push(renderEmailInput(currentQuestions[i], i));
          break;
        case "password":
          views.push(renderPasswordInput(currentQuestions[i], i));
          break;
        case "bodyParts":
          views.push(renderBodyPartsInput(currentQuestions[i], i));
          break;
        case "date":
          views.push(renderDateInput(currentQuestions[i], i, false));
          break;
        case "time":
          views.push(renderDateInput(currentQuestions[i], i, true));
          break;
        case "snap":
          views.push(renderSnapSliderInput(currentQuestions[i], i));
          break;
        default:
          break;
      }
    }
    return views;
  };

  const maxSteps = 1 + questions.length;
  const progress = 2 + groupIndex;
  const title = questions[groupIndex]?.groupTitle || "";

  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerLeft: () => <BackHeader onBack={onBack} />,
          headerRight: () => <SkipHeader onSkip={showClosePopup} />,
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
          {renderAnamnesisQuestions()}
        </ScrollBox>
        <Button onPress={goOn} margin="m">
          {t("common.goOn")}
        </Button>
        <Loading text={t("common.saving")} show={loading} />
      </Box>
    </>
  );
}
