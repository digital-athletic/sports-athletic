import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { VideoPlayer } from "@/video/VideoPlayer";
import { Stack } from "expo-router";
import { type FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { loadTutorials } from "@/data/loadTutorials";

type MappedTutorial = {
  id: string;
  displayTitle: string;
  picture: string;
  video: string;
};

// Hook: loads tutorials & maps title based on current locale
const useTutorials = () => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);

  const tutorials = useMemo(() => {
    const locale = i18n.language.startsWith("en") ? "en" : "default";
    return [...loadTutorials()]
      .sort((a, b) => a.ordering - b.ordering)
      .map((tutorial) => ({
        id: `${tutorial.ordering}`,
        displayTitle: tutorial.title[locale] || tutorial.title.default,
        picture: tutorial.picture,
        video: tutorial.video,
      }));
  }, [i18n.language]);

  useEffect(() => {
    // Simulate async media availability check (legacy fetched missing pictures)
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, [tutorials]);

  return { tutorials, loading };
};

const TutorialListItem: FC<{
  item: MappedTutorial;
}> = ({ item }) => {
  const { colors } = useTheme();
  return (
    <Box
      backgroundColor="white"
      alignSelf="stretch"
      borderTopWidth={1}
      borderBottomWidth={1}
      borderColor="lightGrey3"
      marginVertical="s"
      style={{
        shadowColor: colors.darkGrey2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 2,
      }}
    >
      <VideoPlayer source={item.video} title={item.displayTitle} isTutorial />
    </Box>
  );
};

const TutorialsScreen: FC = () => {
  const { t } = useTranslation();
  const { tutorials, loading } = useTutorials();

  return (
    <>
      {/* Locked to portrait: a full width 16:9 video would be taller than a
          landscape screen. To watch in landscape, open the player's fullscreen
          and turn the device. */}
      <Stack.Screen
        options={{
          title: t("more.technicalVideos"),
          orientation: "portrait",
        }}
      />
      <Box flex={1} backgroundColor="lightGrey2">
        <FlatList
          data={tutorials}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TutorialListItem item={item} />}
          ListHeaderComponent={
            loading ? (
              <Box padding="m" alignItems="center">
                <Text variant="body">{t("more.loadingTutorials")}</Text>
              </Box>
            ) : null
          }
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={2}
          removeClippedSubviews
        />
      </Box>
    </>
  );
};

export default TutorialsScreen;
