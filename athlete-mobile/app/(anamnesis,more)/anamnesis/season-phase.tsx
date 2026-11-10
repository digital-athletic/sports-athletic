import { Loading } from "@/common/Loading";
import { SkipHeader } from "@/common/SkipHeader";
import { SharedConstants } from "@/constants/sharedConstants";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { SeasonPhase as SeasonPhaseEnum } from "@/features/training/models/SeasonPhase";
import {
  deriveSeasonPhaseEndDate,
  isPlanEnded,
} from "@/features/training/utils/timeUtils";
import { DateInputField } from "@/form/DateInputField";
import { ChoiceCards } from "@/form/ChoiceCards";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { formatDateToISO, getDateOneYearFromNow } from "@/utils/date";
import { RoutePath, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

const TWELVE_WEEKS_IN_MS = SharedConstants.TIME_IN_MS.WEEK * 12;

export default function SeasonPhase() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams<{ originPath?: RoutePath }>();
  const originPath = params.originPath;

  const { seasonPhase, setSeasonPhase } = useAnamnesisStore();
  const { workoutData, trainingPlan } = useUserWorkoutStore();
  const hasPhaseType = Boolean(seasonPhase?.type);

  const readInitialSeasonPhase = useEffectEvent(() => {
    const lastSectionInPlan = isPlanEnded(trainingPlan, new Date())
      ? undefined
      : trainingPlan?.sections.at(-1);

    return {
      type: workoutData.seasonPhase?.type ?? null,
      endDate: deriveSeasonPhaseEndDate(lastSectionInPlan),
    };
  });

  useEffect(() => {
    const initializeSeasonPhase = async () => {
      setSeasonPhase(readInitialSeasonPhase());
      setIsLoading(false);
    };

    initializeSeasonPhase();
  }, [setSeasonPhase]);

  const handleGoOn = () => {
    if (!seasonPhase?.type) {
      Alert.alert(
        t("screens.seasonPhase.noPhaseSelectedTitle"),
        t("screens.seasonPhase.noPhaseSelectedMessage"),
      );
      return;
    }

    // currently workout data will always be present due to a mocked state
    if (!workoutData) {
      Alert.alert(
        t("screens.seasonPhase.noWorkoutDataTitle"),
        t("screens.seasonPhase.noWorkoutDataMessage"),
        [
          {
            text: t("screens.seasonPhase.goToProfile"),
            onPress: async () => {
              router.navigate({
                pathname: "/anamnesis/userprofile",
                params: {
                  backPath: "/more" satisfies RoutePath,
                },
              });
            },
          },
          {
            text: t("common.no"),
            onPress: async () => {
              router.navigate("/(tabs)/(home)");
            },
          },
        ],
      );
    }

    // Check if user has workout data (would need to be added to store)
    // For now, proceed to training days
    if (originPath === ("/(tabs)/(more)/more" satisfies RoutePath)) {
      router.navigate({
        pathname: "/anamnesis/training-days",
        params: { originPath },
      });
    } else {
      router.navigate("/anamnesis/training-days");
    }
  };

  const handlePhaseTypeChange = (value: string) => {
    const futureEndDateMs = Date.now() + TWELVE_WEEKS_IN_MS;
    const futureEndDate = formatDateToISO(new Date(futureEndDateMs));

    setSeasonPhase({
      type: value as SeasonPhaseEnum,
      endDate: seasonPhase?.endDate ?? futureEndDate,
    });
  };

  const handlePhaseEndChange = (value: string) => {
    setSeasonPhase({
      type: seasonPhase?.type ?? null,
      endDate: value,
    });
  };

  const phaseOptions = [
    {
      value: SeasonPhaseEnum.PAUSE,
      label: t("screens.seasonPhase.phases.PAUSE"),
      iconName: "bed-outline",
    },
    {
      value: SeasonPhaseEnum.PREPARATORY,
      label: t("screens.seasonPhase.phases.PREPARATORY"),
      iconName: "barbell-outline",
    },
    {
      value: SeasonPhaseEnum.COMPETITION,
      label: t("screens.seasonPhase.phases.COMPETITION"),
      iconName: "trophy-outline",
    },
  ] as const;

  // Calculate progress for progress bar
  const maxSteps = (originPath === "/more" ? 2 : 3) + 3;
  const progress = (originPath === "/more" ? 1 : 2) + 3;

  if (isLoading) {
    return <Loading show text={t("common.loading")} />;
  }

  return (
    <HeadlineScreen
      title={t("screens.seasonPhase.title")}
      heading={t("screens.seasonPhase.seasonPhaseLabel")}
      description={t("screens.seasonPhase.seasonPhaseDescription")}
      step={{ current: progress, total: maxSteps }}
      headerRight={
        <SkipHeader
          alertTitle="screens.seasonPhase.abortQuestion"
          alertMessage={
            hasPhaseType
              ? "screens.seasonPhase.abortExplanation"
              : "screens.seasonPhase.abortIncomplete"
          }
        />
      }
      action={{ label: t("common.goOn"), onPress: handleGoOn }}
    >
      <ChoiceCards
        accessibilityLabel={t("screens.seasonPhase.seasonPhaseLabel")}
        options={phaseOptions}
        value={seasonPhase?.type}
        onChange={handlePhaseTypeChange}
      />

      <AnamnesisQuestionContainer
        title={{ default: t("screens.seasonPhase.endOfSeasonPhaseLabel") }}
        description={{
          default: t("screens.seasonPhase.endOfSeasonPhaseDescription"),
        }}
      >
        <DateInputField
          type="date"
          dateTime={seasonPhase?.endDate}
          onChange={handlePhaseEndChange}
          accessibilityLabel={t("screens.seasonPhase.endOfSeasonPhaseLabel")}
          maximumDate={
            seasonPhase?.endDate ? getDateOneYearFromNow() : undefined
          }
        />
      </AnamnesisQuestionContainer>
    </HeadlineScreen>
  );
}
