import { RoutePath, router, Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { BackHeader } from "@/common/BackHeader";
import { ProgressBar } from "@/common/ProgressBar";
import { SkipHeader } from "@/common/SkipHeader";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { useShowSeasonPhaseAfterAnamnesis } from "@/features/anamnesis/useShowSeasonPhaseAfterAnamnesis";
import { DateInputField } from "@/form/DateInputField";
import { SelectionInputField } from "@/form/SelectionInputField";
import { TextInputField } from "@/form/TextInputField";
import {
  saveDisplayName,
  DISPLAY_NAME_MAX_LENGTH,
} from "@/services/AuthService";
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
  const params = useLocalSearchParams<{ originPath?: RoutePath }>();
  const originPath = params.originPath;

  const {
    personalData,
    setUsername,
    setGender,
    setBirthday,
    anamnesisCompleted,
  } = useUserProfileStore();
  const { resetTrainingSchedule } = useTrainingScheduleStore();

  const showSeasonPhaseAfterAnamnesis = useShowSeasonPhaseAfterAnamnesis();

  const username = personalData.username;
  const gender = personalData.gender;
  const birthday = personalData.birthday;

  const goOn = () => {
    saveDisplayName(username).catch(() => {}); // non-critical; display name re-syncs on next sign-in
    router.push({
      pathname: "/(anamnesis)/anamnesis/anamnesis-questions",
      params: {
        originPath: "/(anamnesis)/anamnesis/userprofile" satisfies RoutePath,
      },
    });
  };

  const handleNameChange = (value: string) => {
    if (value.length <= DISPLAY_NAME_MAX_LENGTH) {
      setUsername(value);
    }
  };

  const handleGenderChange = (values: string[]) => {
    if (values[0] === "MALE" || values[0] === "FEMALE") {
      setGender(values[0]);
    }
  };

  const handleBirthdayChange = async (value: string) => {
    setBirthday(value);
    // Reset training days if age changed
    resetTrainingSchedule();
  };

  const totalSteps = showSeasonPhaseAfterAnamnesis ? 6 : 4;
  const currentStep = 1;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("screens.userProfile.title"),
          headerRight: () =>
            originPath === "/(anamnesis)/anamnesis/sport" ? (
              <SkipHeader
                alertTitle="screens.userProfile.abortAnamnesisQuestion"
                alertMessage={
                  anamnesisCompleted
                    ? "screens.userProfile.abortAnamnesisExplanation"
                    : "screens.userProfile.abortAnamnesisIncomplete"
                }
              />
            ) : null,
          headerLeft: () => <BackHeader />,
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
            iconName="people"
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

        <AnamnesisQuestionContainer
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
            maximumDate={new Date()}
          />
        </AnamnesisQuestionContainer>

        <Button onPress={goOn} margin="m">
          {t("screens.userProfile.goOn")}
        </Button>
      </ScrollBox>
    </>
  );
}
