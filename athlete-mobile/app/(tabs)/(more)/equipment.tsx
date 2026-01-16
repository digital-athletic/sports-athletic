import { BackHeader } from "@/common/BackHeader";
import { Coaching } from "@/common/Coaching";
import { PlaceType, WorkoutConstants } from "@/constants/workoutConstants";
// Navigate to screen-based details instead of embedding component here
import { PlaceSelection } from "@/features/equipment/PlaceSelection";
import { I18nKey } from "@/i18n";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Equipment Screen
 *
 * Allows users to manage available equipment at different training locations.
 * Two stages: place selection and equipment details for selected place.
 */
export default function EquipmentScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { places, setPlaceEquipment, getPlaceEquipment } = usePlacesStore();
  const { trainingDays } = useTrainingScheduleStore();

  const [trainingDaysAtPlaces, setTrainingDaysAtPlaces] = useState<
    Record<PlaceType, I18nKey[]>
  >({
    HOME: [],
    OUTSIDE: [],
    HALL: [],
    STUDIO: [],
  });

  // Initialize training days at places
  useEffect(() => {
    // Remove deactivated equipment from all places
    const placeIds: PlaceType[] = ["HOME", "STUDIO", "HALL", "OUTSIDE"];
    placeIds.forEach((placeId) => {
      const equipment = getPlaceEquipment(placeId);
      const cleanedEquipment = equipment.filter(
        (eq) => !WorkoutConstants.DEACTIVATED_EQUIPMENT.includes(eq),
      );

      if (cleanedEquipment.length !== equipment.length) {
        setPlaceEquipment(placeId, cleanedEquipment);
      }
    });

    // Map training days to places
    const daysAtPlaces: Record<PlaceType, I18nKey[]> = {
      HOME: [],
      OUTSIDE: [],
      HALL: [],
      STUDIO: [],
    };

    trainingDays.forEach((day) => {
      if (day.active) {
        daysAtPlaces[day.place].push(
          WorkoutConstants.WEEKDAY_TRAINING_KEYS[day.weekday],
        );
      }
    });

    setTrainingDaysAtPlaces(daysAtPlaces);
  }, [trainingDays, getPlaceEquipment, setPlaceEquipment]);

  const handleSelectPlace = useCallback(
    (placeId: PlaceType) => {
      router.push({
        pathname: "/(tabs)/(more)/equipment-details",
        params: { placeId },
      });
    },
    [router],
  );

  // Save handled in equipmentDetails screen; keep screen simple here

  return (
    <>
      <Stack.Screen
        options={{
          title: t("equipment.title"),
          headerShown: true,
          headerLeft: () => <BackHeader />,
        }}
      />
      <ScrollBox flex={1} backgroundColor="white">
        <Box backgroundColor="white">
          <Box paddingTop="s" paddingHorizontal="m">
            <Coaching text={t("equipment.coachMessage")} />
          </Box>
          <Box borderTopWidth={1} borderTopColor="lightGrey2" marginTop="s" />
          <PlaceSelection
            selectPlace={handleSelectPlace}
            places={places}
            trainingDaysAtPlaces={trainingDaysAtPlaces}
          />
        </Box>
      </ScrollBox>
    </>
  );
}
