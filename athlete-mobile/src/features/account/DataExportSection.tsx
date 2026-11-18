import { useServerDataExport } from "@/features/account/hooks/useServerDataExport";
import { ListItem } from "@/features/more/ListItem";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import IconDownload from "@tabler/icons-react-native/IconDownload";

/** Download of every row the server stores about the user, as one JSON file. */
export const DataExportSection: FC = () => {
  const { t } = useTranslation();
  const { exportData, isExporting } = useServerDataExport();

  return (
    <>
      <Box paddingHorizontal="l" paddingTop="m" paddingBottom="s">
        <Text variant="sectionTitle" accessibilityRole="header">
          {t("more.account.dataExport.title")}
        </Text>
        <Text variant="description" textAlign="left" marginTop="xs">
          {t("more.account.dataExport.intro")}
        </Text>
      </Box>

      <Box backgroundColor="white" paddingVertical="s">
        <ListItem
          title={t("more.account.dataExport.download")}
          icon={IconDownload}
          iconBackground="primary"
          onPress={() => void exportData()}
          disabled={isExporting}
          isLast
        />
      </Box>
    </>
  );
};
