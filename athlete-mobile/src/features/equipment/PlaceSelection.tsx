import { PlaceType, WorkoutConstants } from "@/constants/workoutConstants";
import { I18nKey } from "@/i18n";
import { PlaceEquipment } from "@/store/placesStore";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
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

  const renderPlace = (place: { id: PlaceType; name: string }) => {
    const placeData = places[place.id];
    const equipment = placeData?.equipment || [];

    // Filter out deactivated equipment
    const activeEquipment = equipment.filter(
      (eq) => !WorkoutConstants.DEACTIVATED_EQUIPMENT.includes(eq),
    );

    const trainingDays = (trainingDaysAtPlaces?.[place.id] || [])
      .map((day) => t(day))
      .join(", ");
    const equipmentCount = t("equipment.xPieces", {
      count: activeEquipment.length,
    });

    return (
      <TouchableOpacity
        key={`place_${place.id}`}
        onPress={() => selectPlace(place.id)}
        accessibilityRole="button"
        accessibilityLabel={[place.name, equipmentCount, trainingDays]
          .filter(Boolean)
          .join(", ")}
        activeOpacity={0.7}
      >
        <Box
          width="100%"
          backgroundColor="white"
          borderBottomWidth={1}
          borderBottomColor="lightGrey2"
          flexDirection="row"
          alignItems="center"
        >
          <Box
            paddingHorizontal="m"
            paddingVertical="m"
            justifyContent="center"
            flex={1}
          >
            <Text variant="cardTitle" marginBottom="xs">
              {place.name}
            </Text>
            <Text variant="body" color="darkGrey1">
              {equipmentCount}
            </Text>
            {trainingDays ? (
              <Text variant="body" color="darkGrey1" marginTop="xs">
                {trainingDays}
              </Text>
            ) : null}
          </Box>
          <Box paddingRight="m">
            <Ionicon
              name="chevron-forward"
              size={20}
              color={colors.lightGrey3}
              decorative
            />
          </Box>
        </Box>
      </TouchableOpacity>
    );
  };

  return <Box>{placesList.map(renderPlace)}</Box>;
};
