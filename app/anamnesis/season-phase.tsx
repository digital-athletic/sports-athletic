import { BackHeader } from "@/common/BackHeader";
import { Loading } from "@/common/Loading";
import { ProgressBar } from "@/common/ProgressBar";
import { SkipHeader } from "@/common/SkipHeader";
import { SharedConstants } from "@/constants/sharedConstants";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { SeasonPhase as SeasonPhaseEnum } from "@/features/training/models/SeasonPhase";
import { DateInputField } from "@/form/DateInputField";
import { SelectionInputField } from "@/form/SelectionInputField";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { dateToDDMMYYYY, DDMMYYYYToDate } from "@/utils/date";
import { Route, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TWELVE_WEEKS_IN_MS = SharedConstants.TIME_IN_MS.WEEK * 12;

export default function SeasonPhase() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams<{ originPath?: Route }>();
  const originPath = params.originPath;

  const {
    originPath: storedOriginPath,
    seasonPhase,
    setSeasonPhase,
  } = useAnamnesisStore();
  const { workoutData, trainingPlan } = useUserWorkoutStore();
  const { questions: anamnesisQuestions } = useAnamnesisStore();
  const { isInInitialAnamnesis, setIsInInitialAnamnesis } =
    useUserProfileStore();

  useEffect(() => {
    const initializeSeasonPhase = async () => {
      const futureEndDateMs = Date.now() + TWELVE_WEEKS_IN_MS;
      let futureEndDate = dateToDDMMYYYY(new Date(futureEndDateMs));

      // Calculate end date based on training plan if available
      let endDate = futureEndDate;
      if (trainingPlan?.sections && trainingPlan.sections.length > 0) {
        const lastSection =
          trainingPlan.sections[trainingPlan.sections.length - 1];
        const sectionStartMs = DDMMYYYYToDate(lastSection.start).getTime();
        const sectionEndMs =
          sectionStartMs +
          SharedConstants.TIME_IN_MS.WEEK * lastSection.numOfWeeks;
        endDate = dateToDDMMYYYY(new Date(sectionEndMs));
      }

      // Set the phase with type from workoutData and calculated endDate
      const phase = {
        type: workoutData.seasonPhase?.type ?? null,
        endDate: endDate,
      };

      setSeasonPhase(phase);
      setIsLoading(false);
    };

    initializeSeasonPhase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    const hasPhaseType = Boolean(seasonPhase?.type);
    const message = hasPhaseType
      ? t("screens.seasonPhase.abortExplanation")
      : t("screens.seasonPhase.abortIncomplete");

    const origin = originPath ?? storedOriginPath;

    Alert.alert(t("screens.seasonPhase.abortQuestion"), message, [
      {
        text: t("common.yes"),
        onPress: () => {
          if (isInInitialAnamnesis) {
            router.navigate({
              pathname: "/more/subscribe",
              params: { goOn: origin satisfies Route | undefined },
            });
            setIsInInitialAnamnesis(false);
            // Navigate to subscription or home
          } else if (origin) {
            router.navigate(origin);
          }
        },
      },
      {
        text: t("common.no"),
      },
    ]);
  };

  const handleGoOn = () => {
    if (!seasonPhase?.type) {
      Alert.alert(
        t("screens.seasonPhase.noPhaseSelectedTitle"),
        t("screens.seasonPhase.noPhaseSelectedMessage")
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
                  backPath: "/more" satisfies Route,
                },
              });
            },
          },
          {
            text: t("common.no"),
            onPress: async () => {
              router.navigate("/(tabs)");
            },
          },
        ]
      );
    }

    // Check if user has workout data (would need to be added to store)
    // For now, proceed to training days
    if (originPath === ("/(tabs)/more" satisfies Route)) {
      router.navigate({
        pathname: "/anamnesis/training-days",
        params: { originPath },
      });
    } else {
      router.navigate("/anamnesis/training-days");
    }
  };

  const handlePhaseTypeChange = (values: string[]) => {
    if (values.length > 0) {
      const futureEndDateMs = Date.now() + TWELVE_WEEKS_IN_MS;
      const futureEndDate = dateToDDMMYYYY(new Date(futureEndDateMs));

      setSeasonPhase({
        type: values[0] as SeasonPhaseEnum,
        endDate: seasonPhase?.endDate ?? futureEndDate,
      });
    }
  };

  const handlePhaseEndChange = (value: string) => {
    setSeasonPhase({
      type: seasonPhase?.type ?? null,
      endDate: value,
    });
  };

  const phaseItems = [
    {
      value: SeasonPhaseEnum.PAUSE,
      displayName: {
        default: t("screens.seasonPhase.phases.PAUSE"),
        en: "Transition",
        de: "Trainingsfrei",
      },
    },
    {
      value: SeasonPhaseEnum.PREPATORY,
      displayName: {
        default: t("screens.seasonPhase.phases.PREPATORY"),
        en: "Prepatory",
        de: "Vorbereitung",
      },
    },
    {
      value: SeasonPhaseEnum.COMPETITION,
      displayName: {
        default: t("screens.seasonPhase.phases.COMPETITION"),
        en: "Competitive",
        de: "Spielsaison",
      },
    },
  ];

  // Calculate progress for progress bar
  const maxSteps = (originPath === "/more" ? 2 : 3) + anamnesisQuestions.length;
  const progress = (originPath === "/more" ? 1 : 2) + anamnesisQuestions.length;

  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          title: t("screens.seasonPhase.title"),
          headerLeft: () => <BackHeader />,
          headerRight: () => <SkipHeader onSkip={handleClose} />,
        }}
      />
      {isLoading ? (
        <Loading show={isLoading} text={t("common.loading")} />
      ) : (
        <Box
          flex={1}
          backgroundColor="lightGrey1"
          style={{ paddingBottom: insets.bottom }}
        >
          <ScrollBox>
            <ProgressBar progress={progress} maximum={maxSteps} />
            <AnamnesisQuestionContainer
              title={{ default: t("screens.seasonPhase.seasonPhaseLabel") }}
              description={{
                default: t("screens.seasonPhase.seasonPhaseDescription"),
              }}
            >
              <SelectionInputField
                onChange={handlePhaseTypeChange}
                iconName="grid"
                selectedItems={seasonPhase?.type ? [seasonPhase.type] : []}
                items={phaseItems}
                singleSelection={true}
              />
            </AnamnesisQuestionContainer>

            <AnamnesisQuestionContainer
              title={{
                default: t("screens.seasonPhase.endOfSeasonPhaseLabel"),
              }}
              description={{
                default: t("screens.seasonPhase.endOfSeasonPhaseDescription"),
              }}
            >
              <DateInputField
                type="date"
                dateTime={seasonPhase?.endDate}
                onChange={handlePhaseEndChange}
              />
            </AnamnesisQuestionContainer>
          </ScrollBox>
          <Button onPress={handleGoOn} margin="m">
            {t("common.goOn")}
          </Button>
        </Box>
      )}
    </>
  );
}
