import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { useTrainingStore } from "@/features/training/trainingStore";
import { ColumnListRow } from "@/features/training/ColumnListRow";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { useTheme } from "@/theme/theme";
import { useResponsiveProp } from "@shopify/restyle";
import { Stack, router } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

const IconThumbnail: FC<{ name: IoniconName }> = ({ name }) => {
  const { colors } = useTheme();
  // Same size and web fallback as the ColumnList thumbnails.
  const size = useResponsiveProp({ phone: 96, tablet: 140 }) ?? 96;

  return (
    <Box
      width={size}
      height={size}
      backgroundColor="white"
      justifyContent="center"
      alignItems="center"
    >
      <Ionicon name={name} size={48} color={colors.primary} decorative />
    </Box>
  );
};

export default function FocusTrainingListScreen() {
  const { t } = useTranslation();
  const { setTrainingSelection } = useTrainingStore();

  const startTraining = (type: "QUICK" | "PREV") => {
    setTrainingSelection(type);
    router.push({ pathname: "/training", params: { type } });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("screens.home.focusTrainings.title"),
          headerShown: true,
        }}
      />
      <ScrollBox flex={1} backgroundColor="lightGrey1">
        <ColumnListRow
          thumbnail={<IconThumbnail name="scan-outline" />}
          title={t("screens.home.focusTraining.title")}
          description={t("screens.home.focusTraining.subtitle")}
          onPress={() => startTraining("QUICK")}
        />
        <ColumnListRow
          thumbnail={<IconThumbnail name="calendar-outline" />}
          title={t("screens.home.preventionTraining.title")}
          description={t("screens.home.preventionTraining.subtitle")}
          onPress={() => startTraining("PREV")}
        />
      </ScrollBox>
    </>
  );
}
