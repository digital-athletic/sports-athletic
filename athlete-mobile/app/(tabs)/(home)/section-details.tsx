import { Hint } from "@/common/Hint";
import { TrainingPlanStatusWidget } from "@/features/training/TrainingPlanStatusWidget";
import type { TrainingSectionType } from "@/features/training/models/TrainingSection";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";

import { SectionPrefix } from "@/features/training/models/SectionPrefix";
import { VideoPlayer } from "@/video/VideoPlayer";
import { useResponsiveProp } from "@shopify/restyle";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadSections } from "@/data/loadSections";

/**
 * Section Details Screen
 *
 * Displays detailed information about a training section including video,
 * target goals, execution hints, and speed/tempo guidelines.
 * Legacy: views/home/pages/SectionDetails
 */
const SectionDetailsScreen: FC = () => {
  const { t, i18n } = useTranslation();
  const { trainingPlan } = useUserWorkoutStore();
  const params = useLocalSearchParams<{ activeSection?: string }>();
  const { SECTIONS_DATA, SECTIONS_VIDEOS } = loadSections();

  const [activeSection, setActiveSection] = useState(
    params.activeSection ? Number(params.activeSection) : 0,
  );

  // Follow the route param whenever it changes to a new section.
  const [prevParamSection, setPrevParamSection] = useState(
    params.activeSection,
  );
  if (prevParamSection !== params.activeSection) {
    setPrevParamSection(params.activeSection);
    if (params.activeSection) {
      setActiveSection(Number(params.activeSection));
    }
  }

  const titleFontSize = useResponsiveProp({ phone: 20, tablet: 24 });

  const trainingSections: TrainingSectionType[] = trainingPlan?.sections ?? [];

  // Calculate current phase - preserved for future use (e.g., test user skip phase buttons)
  // const currentPhase = useMemo(() => {
  //   if (trainingSections.length === 0) return 0;

  //   const weeksPassed = getPassedWeeksSinceDate(trainingSections[0].start);
  //   let calculatedPhase = trainingSections.length - 1;
  //   let weeksPhased = 0;

  //   if (weeksPassed < 0) {
  //     return -1;
  //   }

  //   for (let i = 0; i < trainingSections.length; i++) {
  //     weeksPhased += trainingSections[i].numOfWeeks;
  //     if (weeksPassed < weeksPhased) {
  //       calculatedPhase = i;
  //       break;
  //     }
  //   }

  //   return calculatedPhase;
  // }, [trainingSections]);

  const getSectionPrefix = (type: string): SectionPrefix => {
    switch (type) {
      case "SWR1":
      case "SWR2":
        return "SWR";
      case "MAX_STRENGTH":
      case "MAX":
        return "MAX";
      case "SK":
        return "SK";
      case "SA":
        return "SA";
      default:
        return "SWR";
    }
  };

  const renderVideo = (prefix: SectionPrefix) => {
    const videoData = SECTIONS_VIDEOS[prefix];

    if (!videoData?.picture || !videoData?.video) {
      return (
        <Box padding="m" justifyContent="center" alignItems="center">
          <Text variant="body">{t("training.sectionDetails.noVideo")}</Text>
        </Box>
      );
    }

    return (
      <VideoPlayer
        title={
          videoData.title
            ? t(`training.sectionDetails.videoTitles.${prefix}`)
            : ""
        }
        source={videoData.video}
        isTutorial
      />
    );
  };

  const renderTarget = (prefix: SectionPrefix) => {
    const targetData =
      SECTIONS_DATA[prefix].target[i18n.language] ??
      SECTIONS_DATA[prefix].target.default;

    const messageElements: React.ReactNode[] = [];

    for (let i = 0; i < targetData.normal.length; i++) {
      messageElements.push(
        <Text key={`normal_${i}`} variant="body">
          {targetData.normal[i]}
        </Text>,
      );
      messageElements.push(
        <Text key={`highlight_${i}`} variant="body" fontWeight="bold">
          {targetData.highlight[i]}
        </Text>,
      );
    }

    const lastIndex = targetData.normal.length;
    if (targetData.highlight[lastIndex]) {
      messageElements.push(
        <Text key={`highlight_${lastIndex}`} variant="body" fontWeight="bold">
          {targetData.highlight[lastIndex]}
        </Text>,
      );
    }

    return (
      <Box padding="m">
        <Text variant="title" marginBottom="m" fontSize={titleFontSize}>
          {t("training.sectionDetails.target")}
        </Text>
        <Text variant="body">{messageElements}</Text>
      </Box>
    );
  };

  const renderCaption = (prefix: SectionPrefix) => {
    return (
      <Box padding="m">
        <Hint
          type="HINT"
          message={t(`training.sectionDetails.captions.${prefix}`)}
        />
      </Box>
    );
  };

  const renderSpeed = (prefix: SectionPrefix) => {
    const speedData = SECTIONS_DATA[prefix].speed;
    const values = speedData.values[i18n.language] ?? speedData.values.default;
    const description =
      speedData.description[i18n.language] ?? speedData.description.default;

    const valueString = values.join(" : ");

    return (
      <Box padding="m">
        <Text variant="title" marginBottom="m" fontSize={titleFontSize}>
          {t("training.sectionDetails.speed")}
        </Text>
        <Text variant="body" marginBottom="s">
          {valueString}
        </Text>
        {description && <Text variant="body">{description}</Text>}
      </Box>
    );
  };

  const renderSectionDetails = () => {
    if (!trainingSections[activeSection]) {
      return (
        <Box padding="m" justifyContent="center" alignItems="center">
          <Text variant="body">
            {t("training.sectionDetails.chooseSection")}
          </Text>
        </Box>
      );
    }

    const prefix = getSectionPrefix(trainingSections[activeSection].type);

    return (
      <Box flex={1}>
        <Text variant="title" padding="m" fontSize={titleFontSize}>
          {t(`training.sectionDetails.sectionTitles.${prefix}`)}
        </Text>
        {renderVideo(prefix)}
        {renderTarget(prefix)}
        {renderCaption(prefix)}
        {renderSpeed(prefix)}
      </Box>
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      {/* Locked to portrait: a full width 16:9 video would be taller than a
          landscape screen. To watch in landscape, open the player's fullscreen
          and turn the device. */}
      <Stack.Screen
        options={{
          title: t("training.sectionDetails.title"),
          headerShown: true,
          orientation: "portrait",
        }}
      />
      <ScrollBox
        flex={1}
        backgroundColor="white"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Box flex={1} minHeight={140} paddingTop="m" paddingHorizontal="m">
          <TrainingPlanStatusWidget
            trainingSections={trainingSections}
            goToSectionDetails={setActiveSection}
            activeSection={activeSection}
          />
        </Box>

        {renderSectionDetails()}

        <Box padding="m" paddingBottom="xl">
          <Button onPress={handleBack}>{t("common.back")}</Button>
        </Box>
      </ScrollBox>
    </>
  );
};

export default SectionDetailsScreen;
