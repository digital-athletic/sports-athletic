import { BackHeader } from "@/common/BackHeader";
import { Loading } from "@/common/Loading";
import { ProgressBar } from "@/common/ProgressBar";
import { SkipHeader } from "@/common/SkipHeader";
import { SharedConstants } from "@/constants/sharedConstants";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { SeasonPhase as SeasonPhaseEnum } from "@/features/training/models/SeasonPhase";
import { deriveSeasonPhaseEndDate } from "@/features/training/utils/timeUtils";
import { DateInputField } from "@/form/DateInputField";
import { SelectionInputField } from "@/form/SelectionInputField";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { formatDateToISO, getDateOneYearFromNow } from "@/utils/date";
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

  const { seasonPhase, setSeasonPhase } = useAnamnesisStore();
  const { workoutData, trainingPlan } = useUserWorkoutStore();
  const hasPhaseType = Boolean(seasonPhase?.type);

  useEffect(() => {
    const initializeSeasonPhase = async () => {
      const lastSectionInPlan = trainingPlan?.sections
        ? trainingPlan.sections[trainingPlan.sections.length - 1]
        : undefined;

      const endDate = deriveSeasonPhaseEndDate(lastSectionInPlan);

      // Set the phase with type from workoutData and calculated endDate
      setSeasonPhase({
        type: workoutData.seasonPhase?.type ?? null,
        endDate: endDate,
      });
      setIsLoading(false);
    };

    initializeSeasonPhase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                  backPath: "/more" satisfies Route,
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
    if (originPath === ("/(tabs)/(more)/more" satisfies Route)) {
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
      const futureEndDate = formatDateToISO(new Date(futureEndDateMs));

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
      value: SeasonPhaseEnum.PREPARATORY,
      displayName: {
        default: t("screens.seasonPhase.phases.PREPARATORY"),
        en: "Preparatory",
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
  const maxSteps = (originPath === "/more" ? 2 : 3) + 3;
  const progress = (originPath === "/more" ? 1 : 2) + 3;

  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("screens.seasonPhase.title"),
          headerLeft: () => <BackHeader />,
          headerRight: () => (
            <SkipHeader
              alertTitle="screens.seasonPhase.abortQuestion"
              alertMessage={
                hasPhaseType
                  ? "screens.seasonPhase.abortExplanation"
                  : "screens.seasonPhase.abortIncomplete"
              }
            />
          ),
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
                maximumDate={
                  seasonPhase?.endDate ? getDateOneYearFromNow() : undefined
                }
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
