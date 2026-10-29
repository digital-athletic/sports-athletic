import { BackHeader } from "@/common/BackHeader";
import { Ionicon } from "@/common/Ionicon";
import { PlaceType, WorkoutConstants } from "@/constants/workoutConstants";
import { useUpdateTrainingPlan } from "@/features/training/hooks/useUpdateTrainingPlan";
import { Logger } from "@/services/Logger";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";

export default function EquipmentDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { trainingDays } = useTrainingScheduleStore();
  const { trainingPlan } = useUserWorkoutStore();
  const { updateTrainingPlan } = useUpdateTrainingPlan();

  const placeParam = params.placeId as string | undefined;
  const placeId: PlaceType = (placeParam as PlaceType) ?? "STUDIO";

  const storedPlaceEquipment = usePlacesStore(
    (state) => state.places[placeId].equipment,
  );
  const setPlaceEquipment = usePlacesStore((state) => state.setPlaceEquipment);

  const [placeEquipment, setLocalPlaceEquipment] =
    useState<string[]>(storedPlaceEquipment);

  const currentEquipment = [...placeEquipment].sort();
  const savedEquipment = [...storedPlaceEquipment].sort();
  const hasChanges =
    currentEquipment.length !== savedEquipment.length ||
    currentEquipment.some((eq, i) => eq !== savedEquipment[i]);

  const handleToggleEquipment = (equipmentId: string, wasActive: boolean) => {
    setLocalPlaceEquipment((prev) => {
      if (wasActive) {
        return prev.filter((eq) => eq !== equipmentId);
      } else {
        return [...prev, equipmentId];
      }
    });
  };

  const handleSaveChanges = () => {
    setPlaceEquipment(placeId, placeEquipment);

    // Check if place is used in any active training day
    const isPlaceUsedInActiveDays = trainingDays.some(
      (day) => day.active && day.place === placeId,
    );

    // Regenerate training plan if place is used and plan exists
    if (isPlaceUsedInActiveDays && trainingPlan) {
      updateTrainingPlan();
      Logger.logEvent("trainingplan_updated_by_equipment_change");
    }

    router.back();
  };

  const equipmentKeys = (
    Object.keys(
      WorkoutConstants.EQUIPMENT,
    ) as (keyof typeof WorkoutConstants.EQUIPMENT)[]
  )
    .filter((key) => !WorkoutConstants.DEACTIVATED_EQUIPMENT.includes(key))
    .sort((a, b) => {
      const aName = t(
        `equipment.items.${WorkoutConstants.EQUIPMENT[a]}`,
      ).toUpperCase();
      const bName = t(
        `equipment.items.${WorkoutConstants.EQUIPMENT[b]}`,
      ).toUpperCase();
      return aName.localeCompare(bName);
    });

  const equipmentCountKeySuffix = (placeId.charAt(0) +
    placeId.slice(1).toLowerCase()) as "Home" | "Studio" | "Hall" | "Outside";

  const equipmentCountKey =
    `equipment.equipmentAt${equipmentCountKeySuffix}` as const;

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerShown: true,
          headerLeft: () => (
            <BackHeader
              onBack={() => {
                if (hasChanges) {
                  Alert.alert(
                    t("equipment.leavePageQuestion"),
                    t("equipment.changesWillBeLost"),
                    [
                      {
                        text: t("equipment.leave"),
                        onPress: () => {
                          Logger.logEvent("equipment_reset", {});
                          router.back();
                        },
                      },
                      {
                        text: t("equipment.abort"),
                        onPress: () => {
                          Logger.logEvent("equipment_reset_aborted", {});
                        },
                      },
                    ],
                  );
                } else {
                  router.back();
                }
              }}
            />
          ),
        }}
      />
      <ScrollBox
        flex={1}
        backgroundColor="white"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Box padding="m">
          <Text variant="title" color="darkGrey3">
            {t(equipmentCountKey)}
          </Text>
          <Text variant="body" color="darkGrey1" marginBottom="s">
            {t("equipment.xEquipmentPiecesSelected", {
              count: placeEquipment.length,
            })}
          </Text>
          {equipmentKeys.map((key) => {
            const equipmentId = WorkoutConstants.EQUIPMENT[key];
            const isActive = placeEquipment.includes(equipmentId);

            return (
              <TouchableOpacity
                key={`eq_${equipmentId}`}
                style={[
                  styles.equipmentItem,
                  {
                    borderTopColor: colors.lightGrey2,
                  },
                ]}
                onPress={() => handleToggleEquipment(equipmentId, isActive)}
                accessibilityRole="button"
                accessibilityLabel={t(`equipment.items.${equipmentId}`)}
                accessibilityState={{ selected: isActive }}
              >
                {isActive ? (
                  <Ionicon
                    name="checkmark-circle"
                    size={28}
                    color={colors.primary}
                    decorative
                  />
                ) : (
                  <Box
                    width={28}
                    height={28}
                    borderRadius="xl"
                    backgroundColor="lightGrey2"
                  />
                )}
                <Text variant="button" color="darkGrey3" marginLeft="m">
                  {t(`equipment.items.${equipmentId}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Box>
      </ScrollBox>
      {hasChanges && (
        <Box
          position="absolute"
          right={16}
          bottom={16}
          width="40%"
          minHeight={56}
        >
          <Button onPress={handleSaveChanges}>
            <Box alignItems="center">
              <Text variant="button" color="white">
                {t("common.save")}
              </Text>
              <Text variant="small" color="white">
                {t("equipment.planWillBeUpdated")}
              </Text>
            </Box>
          </Button>
        </Box>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  equipmentItem: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    minHeight: 56,
    borderTopWidth: 1,
    paddingVertical: 8,
  },
});
