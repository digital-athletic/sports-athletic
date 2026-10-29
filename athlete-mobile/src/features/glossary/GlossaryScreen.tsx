import { ListDivider } from "@/common/ListDivider";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { Stack } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { GLOSSARY_TERM_IDS, type GlossaryTermId } from "./glossaryTerms";

const GlossaryListItem: FC<{ id: GlossaryTermId }> = ({ id }) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Box paddingHorizontal="l" paddingVertical="s">
        <Text variant="body" accessibilityRole="header">
          {t(`more.glossary.terms.${id}.term`)}
        </Text>
        <Text variant="small" color="darkGrey2">
          {t(`more.glossary.terms.${id}.explanation`)}
        </Text>
      </Box>
      <ListDivider hasLeadingIcon={false} />
    </Box>
  );
};

export function GlossaryScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("more.glossary.title") }} />
      <Box flex={1} backgroundColor="white">
        <FlatList
          data={GLOSSARY_TERM_IDS}
          keyExtractor={(id) => id}
          renderItem={({ item }) => <GlossaryListItem id={item} />}
          ListHeaderComponent={
            <Text variant="body" color="darkGrey3" padding="l">
              {t("more.glossary.intro")}
            </Text>
          }
          contentInsetAdjustmentBehavior="automatic"
          accessibilityRole="list"
          showsVerticalScrollIndicator={false}
        />
      </Box>
    </>
  );
}
