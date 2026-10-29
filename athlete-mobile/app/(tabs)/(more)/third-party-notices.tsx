import { ListDivider } from "@/common/ListDivider";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { Stack } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import NOTICES from "../../../assets/data/thirdPartyNotices.json";

type Notice = {
  name: string;
  version: string;
  license: string;
};

const NoticeListItem: FC<{ item: Notice }> = ({ item }) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Box paddingHorizontal="l" paddingVertical="s">
        <Text variant="body">{item.name}</Text>
        <Text variant="small" color="darkGrey2">
          {t("more.thirdPartyNotices.versionAndLicense", {
            version: item.version,
            license: item.license,
          })}
        </Text>
      </Box>
      <ListDivider hasLeadingIcon={false} />
    </Box>
  );
};

export default function ThirdPartyNoticesScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{
          title: t("more.thirdPartyNotices.title"),
        }}
      />
      <Box flex={1} backgroundColor="white">
        <FlatList
          data={NOTICES}
          keyExtractor={(item) => `${item.name}@${item.version}`}
          renderItem={({ item }) => <NoticeListItem item={item} />}
          ListHeaderComponent={
            <Text variant="body" color="darkGrey3" padding="l">
              {t("more.thirdPartyNotices.intro")}
            </Text>
          }
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        />
      </Box>
    </>
  );
}
