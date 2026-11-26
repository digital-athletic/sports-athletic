import { useDeleteAccount } from "@/auth/useAuthActions";
import { ListItem } from "@/features/more/ListItem";
import { DataExportSection } from "@/features/account/DataExportSection";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Stack } from "expo-router";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import IconTrash from "@tabler/icons-react-native/IconTrash";

const DeletingOverlay: FC = () => {
  const { t } = useTranslation();
  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="scrim"
      opacity={0.5}
      justifyContent="center"
      alignItems="center"
    >
      <Text variant="title" color="white">
        {t("more.deletingAccount")}
      </Text>
    </Box>
  );
};

/** Account hub: downloads of the data stored on the server, and account deletion. */
export const AccountScreen: FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { deleteAccount, isLoading: isDeleting } = useDeleteAccount();

  return (
    <>
      <Stack.Screen
        options={{
          title: t("more.account.title"),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
        }}
      />
      <ScrollBox
        flex={1}
        backgroundColor="surface"
        contentInsetAdjustmentBehavior="automatic"
      >
        <DataExportSection />

        {/* Separates the irreversible delete action from the downloads. */}
        <Box height={10} backgroundColor="surfaceContainerHigh" />

        <Box backgroundColor="surface" paddingVertical="s">
          <ListItem
            title={t("more.deleteUser")}
            icon={IconTrash}
            iconBackground="onSurfaceVariant"
            onPress={deleteAccount}
            isLast
          />
        </Box>
      </ScrollBox>

      {isDeleting && <DeletingOverlay />}
    </>
  );
};
