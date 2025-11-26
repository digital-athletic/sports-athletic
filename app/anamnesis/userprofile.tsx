import { Route, router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler } from "react-native";

import { BackHeader } from "@/common/BackHeader";
import { ProgressBar } from "@/common/ProgressBar";
import { SkipHeader } from "@/common/SkipHeader";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { SelectionInputField } from "@/form/SelectionInputField";
import { TextInputField } from "@/form/TextInputField";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";

/**
 * UserProfile Component
 *
 * Personal data collection screen in anamnesis flow.
 * Collects username, gender, and birthday before proceeding to anamnesis questions.
 * Migrated from: legacy/views/data/Userprofile.js
 */
export default function UserProfileScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ originPath?: Route }>();
  const originPath = params.originPath;

  const {
    personalData,
    setUsername,
    setGender,
    setBirthday,
    anamnesisCompleted,
  } = useUserProfileStore();
  const { getActiveTrainingDays, resetToDefaults } = useTrainingScheduleStore();
  const { questions, loadQuestions } = useAnamnesisStore();

  const username = personalData.username;
  const gender = personalData.gender;
  // react-native-date-picker requires expo prebuild setup
  const birthday = personalData.birthday;

  const hasActiveTrainingDay = getActiveTrainingDays().length > 0;

  // Load anamnesis questions on mount
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const onBack = useCallback(() => {
    if (originPath === ("/anamnesis/sport" satisfies Route)) {
      router.back();
    } else {
      router.replace("/(tabs)/more");
    }
  }, [originPath]);

  const showClosePopup = useCallback(() => {
    const message = anamnesisCompleted
      ? t("screens.userProfile.abortAnamnesisExplanation")
      : t("screens.userProfile.abortAnamnesisIncomplete");

    Alert.alert(t("screens.userProfile.abortAnamnesisQuestion"), message, [
      {
        text: t("screens.userProfile.yes"),
        onPress: () => {
          router.replace("/(tabs)");
        },
      },
      {
        text: t("screens.userProfile.no"),
      },
    ]);
  }, [t, anamnesisCompleted]);

  const handleBackPress = useCallback(() => {
    if (originPath === "/anamnesis/sport") {
      return false; // Allow back to Sport
    } else {
      showClosePopup();
      return true;
    }
  }, [originPath, showClosePopup]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => subscription.remove();
  }, [handleBackPress]);

  const goOn = () => {
    router.push({
      pathname: "/anamnesis/anamnesis-questions",
      params: { originPath: "/anamnesis/userprofile" satisfies Route },
    });
  };

  const handleNameChange = (value: string) => {
    setUsername(value);
  };

  const handleGenderChange = (values: string[]) => {
    if (values[0] === "MALE" || values[0] === "FEMALE") {
      setGender(values[0]);
    }
  };

  const handleBirthdayChange = async (value: string) => {
    setBirthday(value);
    // Reset training days if age changed
    resetToDefaults();
  };

  // Calculate max steps for progress bar
  // In legacy: 3 + anamnesisQuestions.length or 1 + anamnesisQuestions.length if hasActiveTrainingDay
  const totalSteps = hasActiveTrainingDay
    ? 1 + questions.length
    : 3 + questions.length;
  const currentStep = 1;

  return (
    <>
      <Stack.Screen
        options={{
          title: t("screens.userProfile.title"),
          headerRight: () =>
            originPath === "/anamnesis/sport" ? (
              <SkipHeader onSkip={showClosePopup} />
            ) : null,
          headerLeft: () => <BackHeader onBack={onBack} />,
        }}
      />
      <ScrollBox flex={1} backgroundColor="lightGrey1">
        <ProgressBar progress={currentStep} maximum={totalSteps} />
        <AnamnesisQuestionContainer
          title={{
            default: t("screens.userProfile.usernameTitle"),
          }}
          description={{
            default: t("screens.userProfile.usernameDescription"),
          }}
        >
          <TextInputField
            value={username}
            placeholder={t("screens.userProfile.usernamePlaceholder")}
            iconName="person"
            onChange={handleNameChange}
          />
        </AnamnesisQuestionContainer>

        <AnamnesisQuestionContainer
          title={{
            default: t("screens.userProfile.genderTitle"),
          }}
          description={{
            default: t("screens.userProfile.genderDescription"),
          }}
        >
          <SelectionInputField
            onChange={handleGenderChange}
            awesomeIconName="venus-mars"
            selectedItems={[gender]}
            items={[
              {
                value: "MALE",
                displayName: {
                  default: t("screens.userProfile.male"),
                },
              },
              {
                value: "FEMALE",
                displayName: {
                  default: t("screens.userProfile.female"),
                },
              },
            ]}
            singleSelection={true}
          />
        </AnamnesisQuestionContainer>

        {/* <AnamnesisQuestionContainer
          title={{
            default: t("screens.userProfile.birthdayTitle"),
          }}
          description={{
            default: t("screens.userProfile.birthdayDescription"),
          }}
        >
          <DateInputField
            type="date"
            dateTime={birthday}
            onChange={handleBirthdayChange}
          />
        </AnamnesisQuestionContainer> */}

        <Button onPress={goOn} margin="m">
          {t("screens.userProfile.goOn")}
        </Button>
      </ScrollBox>
    </>
  );
}
