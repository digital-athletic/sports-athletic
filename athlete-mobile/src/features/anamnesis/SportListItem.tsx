import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";

import { WorkoutConstants } from "@/constants/workoutConstants";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";

interface SportListItemProps {
  sportKey: keyof typeof WorkoutConstants.SPORTS;
  isSelected: boolean;
  onPress: () => void;
}

export const SportListItem: FC<SportListItemProps> = ({
  sportKey,
  isSelected,
  onPress,
}) => {
  const { t } = useTranslation();
  const sportName = t(`sports.${sportKey}`);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.listItem}
      accessibilityLabel={sportName}
      accessibilityRole="button"
    >
      <Box
        style={styles.listImage}
        backgroundColor="white"
        borderWidth={1}
        borderColor="lightGrey2"
      />
      <Box style={styles.listContent}>
        <Text variant="cardTitle" color="darkGrey3">
          {t(`sports.${sportKey}`)}
        </Text>
        {isSelected && (
          <Text variant="body" color="primary" paddingTop="xs">
            {t("screens.sport.sportSelected")}
          </Text>
        )}
      </Box>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  listItem: {
    position: "relative",
    width: "100%",
    height: 100,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  listImage: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 100,
    width: 100,
  },
  listContent: {
    marginLeft: 100,
    padding: 15,
  },
});
