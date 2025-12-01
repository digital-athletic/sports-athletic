import { PlaceType, WorkoutConstants } from "@/constants/workoutConstants";
import { I18nKey } from "@/i18n";
import { PlaceEquipment } from "@/store/placesStore";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicon } from "../../common/Ionicon";
import { Box } from "../../theme/Box";
import { Text } from "../../theme/Text";
import { useTheme } from "../../theme/theme";

export type PlaceSelectionProps = {
  selectPlace: (placeId: PlaceType) => void;
  places: Record<PlaceType, PlaceEquipment>;
  trainingDaysAtPlaces?: Record<PlaceType, I18nKey[]>;
};

/**
 * PlaceSelection Component
 *
 * Displays a list of training locations with their available equipment count.
 * Shows which training days are scheduled at each location.
 */
export const PlaceSelection: FC<PlaceSelectionProps> = ({
  selectPlace,
  places,
  trainingDaysAtPlaces,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const placesList: { id: PlaceType; name: string }[] = [
    { id: "HOME", name: t("training.place.HOME") },
    { id: "STUDIO", name: t("training.place.STUDIO") },
    { id: "HALL", name: t("training.place.HALL") },
    { id: "OUTSIDE", name: t("training.place.OUTSIDE") },
  ];

  const renderPlace = (
    place: { id: PlaceType; name: string },
    isLast: boolean,
  ) => {
    const placeData = places[place.id];
    const equipment = placeData?.equipment || [];

    // Filter out deactivated equipment
    const activeEquipment = equipment.filter(
      (eq) => !WorkoutConstants.DEACTIVATED_EQUIPMENT.includes(eq),
    );

    const trainingDays = trainingDaysAtPlaces?.[place.id] || [];

    return (
      <TouchableOpacity
        key={`place_${place.id}`}
        onPress={() => selectPlace(place.id)}
        style={[
          styles.placeEntry,
          {
            borderTopColor: colors.darkGrey1,
          },
          isLast && {
            borderBottomWidth: 0.5,
            borderBottomColor: colors.darkGrey1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${place.name}, ${activeEquipment.length} ${t("equipment.xPieces", { count: activeEquipment.length })}`}
      >
        <Box
          flex={1}
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box flex={1}>
            <Text variant="title" color="darkGrey3">
              {place.name}
            </Text>
            {trainingDays.length > 0 ? (
              <Text variant="small" color="darkGrey2" marginTop="xs">
                {trainingDays.map((day) => t(day)).join(", ")}
              </Text>
            ) : null}
          </Box>
          <Box
            flexDirection="row"
            alignItems="center"
            backgroundColor="lightGrey2"
            borderRadius="xl"
            paddingHorizontal="s"
            paddingVertical="xs"
          >
            <Text variant="body" color="darkGrey2" marginRight="xs">
              {t("equipment.xPieces", { count: activeEquipment.length })}
            </Text>
            <Ionicon
              name="chevron-forward"
              size={15}
              color={colors.darkGrey2}
            />
          </Box>
        </Box>
      </TouchableOpacity>
    );
  };

  return (
    <Box padding="m">
      <Text variant="title" color="darkGrey3" marginBottom="s">
        {t("equipment.trainingLocation")}
      </Text>
      {placesList.map((place, index) =>
        renderPlace(place, index === placesList.length - 1),
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  placeEntry: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "stretch",
    minHeight: 78,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
});
