import { RoutePath, router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { SkipHeader } from "@/common/SkipHeader";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { useShowSeasonPhaseAfterAnamnesis } from "@/features/anamnesis/useShowSeasonPhaseAfterAnamnesis";
import { DateInputField } from "@/form/DateInputField";
import { ChoiceCards } from "@/form/ChoiceCards";
import { TextInputField } from "@/form/TextInputField";
import {
  saveDisplayName,
  DISPLAY_NAME_MAX_LENGTH,
} from "@/services/AuthService";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";

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

  const handleGenderChange = (value: string) => {
    if (value === "MALE" || value === "FEMALE") {
      setGender(value);
    }
  };

  const handleBirthdayChange = async (value: string) => {
    setBirthday(value);
    // Reset training days if age changed
    resetTrainingSchedule();
  };

  const totalSteps = showSeasonPhaseAfterAnamnesis ? 6 : 4;
  const currentStep = 1;

  const genderOptions = [
    {
      value: "MALE",
      label: t("screens.userProfile.male"),
      iconName: "male-outline",
    },
    {
      value: "FEMALE",
      label: t("screens.userProfile.female"),
      iconName: "female-outline",
    },
  ] as const;

  return (
    <HeadlineScreen
      title={t("screens.userProfile.title")}
      heading={t("screens.userProfile.title")}
      step={{ current: currentStep, total: totalSteps }}
      headerRight={
        originPath === "/(anamnesis)/anamnesis/sport" ? (
          <SkipHeader
            alertTitle="screens.userProfile.abortAnamnesisQuestion"
            alertMessage={
              anamnesisCompleted
                ? "screens.userProfile.abortAnamnesisExplanation"
                : "screens.userProfile.abortAnamnesisIncomplete"
            }
          />
        ) : null
      }
      action={{ label: t("screens.userProfile.goOn"), onPress: goOn }}
    >
      <AnamnesisQuestionContainer
        title={{ default: t("screens.userProfile.usernameTitle") }}
        description={{ default: t("screens.userProfile.usernameDescription") }}
      >
        <TextInputField
          value={username}
          placeholder={t("screens.userProfile.usernamePlaceholder")}
          iconName="person-outline"
          accessibilityLabel={t("screens.userProfile.usernameTitle")}
          onChange={handleNameChange}
        />
      </AnamnesisQuestionContainer>

      <AnamnesisQuestionContainer
        title={{ default: t("screens.userProfile.genderTitle") }}
        description={{ default: t("screens.userProfile.genderDescription") }}
      >
        <ChoiceCards
          accessibilityLabel={t("screens.userProfile.genderTitle")}
          direction="row"
          options={genderOptions}
          value={gender}
          onChange={handleGenderChange}
        />
      </AnamnesisQuestionContainer>

      <AnamnesisQuestionContainer
        title={{ default: t("screens.userProfile.birthdayTitle") }}
        description={{ default: t("screens.userProfile.birthdayDescription") }}
      >
        <DateInputField
          type="date"
          dateTime={birthday}
          onChange={handleBirthdayChange}
          maximumDate={new Date()}
          accessibilityLabel={t("screens.userProfile.birthdayTitle")}
        />
      </AnamnesisQuestionContainer>
    </HeadlineScreen>
  );
}
