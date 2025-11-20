import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import {
  dateToDDMMYYYY,
  dateToHHMM,
  DDMMYYYYToDate,
  HHMMToDate,
} from "@/utils/date";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";
import DatePicker from "react-native-date-picker";
import { Ionicon } from "../common/Ionicon";

interface DateInputFieldProps {
  type: "date" | "time";
  dateTime?: string;
  onChange: (value: string) => void;
}

/**
 * Date/Time picker input field
 */
export const DateInputField: FC<DateInputFieldProps> = ({
  type,
  dateTime,
  onChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const iconName = type === "date" ? "calendar" : "time";

  // Parse existing dateTime or use current date
  const getCurrentDate = (): Date => {
    if (!dateTime) return new Date();

    if (type === "date") {
      return DDMMYYYYToDate(dateTime);
    }
    return HHMMToDate(dateTime);
  };

  const handleConfirm = (date: Date) => {
    setIsOpen(false);
    if (type === "date") {
      onChange(dateToDDMMYYYY(date));
    } else {
      onChange(dateToHHMM(date));
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Box
        flexDirection="row"
        alignItems="center"
        backgroundColor="lightGrey2"
        borderRadius="m"
        height={56}
      >
        <Box
          width={56}
          height={56}
          justifyContent="center"
          alignItems="center"
          backgroundColor="lightGrey1"
          borderTopLeftRadius="m"
          borderBottomLeftRadius="m"
        >
          <Ionicon
            name={iconName}
            size={24}
            color={colors.lightGrey3}
            accessibilityLabel={`${type}-icon`}
          />
        </Box>
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setIsOpen(true)}
        >
          <Text variant="body" color="darkGrey3" marginLeft="s">
            {dateTime || t("common.choose")}
          </Text>
        </TouchableOpacity>
      </Box>

      <DatePicker
        modal
        open={isOpen}
        date={getCurrentDate()}
        mode={type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        cancelText={t("common.cancel")}
        confirmText={t("common.confirm")}
        locale={type === "time" ? "de" : undefined}
        is24hourSource="locale"
      />
    </>
  );
};

const styles = StyleSheet.create({
  datePicker: {
    flex: 1,
    justifyContent: "center",
  },
});
