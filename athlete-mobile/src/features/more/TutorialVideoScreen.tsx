import { useTutorials } from "@/features/more/useTutorials";
import { Box } from "@/theme/Box";
import { VideoPlayer } from "@/video/VideoPlayer";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

/** Plays one technique video; opened from a row of the introduction videos list. */
export default function TutorialVideoScreen() {
  const { t } = useTranslation();
  const { tutorialId } = useLocalSearchParams<{ tutorialId: string }>();
  const tutorial = useTutorials().find((entry) => entry.id === tutorialId);

  return (
    <>
      {/* Phones stay in portrait: a full width 16:9 video would be taller than a
          landscape screen. To watch in landscape, open the player's fullscreen
          and turn the device. */}
      <Stack.Screen
        options={{
          title: tutorial?.title ?? t("more.introductionVideos"),
          orientation: "portrait",
        }}
      />
      <Box flex={1} backgroundColor="lightGrey2">
        {tutorial && <VideoPlayer source={tutorial.video} isTutorial />}
      </Box>
    </>
  );
}
