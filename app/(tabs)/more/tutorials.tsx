import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Video } from "@/video/Video";
import { Stack, useRouter } from "expo-router";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, TouchableOpacity } from "react-native";
import TUTORIALS from "../../../assets/data/tutorials/TUTORIALS"; // legacy data file

type TutorialItem = {
  ordering: number;
  title: { default: string; en?: string };
  picture: string;
  video: string;
};

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
    return (TUTORIALS as TutorialItem[])
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
  onPress: (t: MappedTutorial) => void;
}> = ({ item, onPress }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={t("more.tutorialVideoAlt", {
        title: item.displayTitle,
      })}
      style={{ alignSelf: "stretch" }}
    >
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
        <Video
          isPause={false}
          videoTitle={item.displayTitle}
          videoName={item.video}
          title={item.displayTitle}
          pictureName={item.picture}
          size="Big"
          changeVideoProperties={() => {}}
          playButtonDisabled={true}
        />
      </Box>
    </TouchableOpacity>
  );
};

const TutorialsScreen: FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { tutorials, loading } = useTutorials();

  const handlePress = useCallback(
    (tutorial: MappedTutorial) => {
      router.navigate({
        pathname: "/video-player",
        params: {
          title: tutorial.displayTitle,
          videoName: tutorial.video,
          pictureName: tutorial.picture,
          backPath: "tutorials",
        },
      });
    },
    [router],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t("more.technicalVideos"),
        }}
      />
      <Box flex={1} backgroundColor="lightGrey2">
        {loading && (
          <Box padding="m" alignItems="center">
            <Text variant="body">{t("more.loadingTutorials")}</Text>
          </Box>
        )}
        <FlatList
          data={tutorials}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TutorialListItem item={item} onPress={handlePress} />
          )}
          showsVerticalScrollIndicator={false}
        />
      </Box>
    </>
  );
};

export default TutorialsScreen;
