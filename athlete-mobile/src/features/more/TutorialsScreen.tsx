import { IntroVideoLinks } from "@/features/more/IntroVideoLinks";
import { ListItem } from "@/features/more/ListItem";
import { useTutorials } from "@/features/more/useTutorials";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

/** Lists the introduction video links and one row per technique video. */
export default function TutorialsScreen() {
  const { t } = useTranslation();
  const tutorials = useTutorials();

  return (
    <>
      <Stack.Screen options={{ title: t("more.introductionVideos") }} />
      <ScrollBox
        flex={1}
        backgroundColor="lightGrey2"
        contentInsetAdjustmentBehavior="automatic"
      >
        <IntroVideoLinks />
        <Box backgroundColor="white" paddingTop="s">
          {tutorials.map((tutorial, index) => (
            <ListItem
              key={tutorial.id}
              title={tutorial.title}
              navPath="/(tabs)/(more)/tutorial/[tutorialId]"
              navParams={{ tutorialId: tutorial.id }}
              icon="videocam"
              iconBackground="primary"
              isLast={index === tutorials.length - 1}
            />
          ))}
        </Box>
      </ScrollBox>
    </>
  );
}
