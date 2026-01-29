import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import {
  dateToISODate,
  dateToHHMM,
  ISODateToDate,
  HHMMToDate,
} from "@/utils/date";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicon } from "../common/Ionicon";

interface DateInputFieldProps {
  type: "date" | "time";
  dateTime?: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

/**
 * Date/Time picker input field
 */
export const DateInputField: FC<DateInputFieldProps> = ({
  type,
  dateTime,
  onChange,
  maximumDate,
  minimumDate,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const iconName = type === "date" ? "calendar" : "time";

  // Parse existing dateTime or use current date
  // ISODateToDate handles both ISO 8601 and legacy DD-MM-YYYY formats
  const getCurrentDate = (): Date => {
    if (!dateTime) return new Date();

    if (type === "date") {
      return ISODateToDate(dateTime);
    }
    return HHMMToDate(dateTime);
  };

  const handleChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      if (type === "date") {
        onChange(dateToISODate(selectedDate));
      } else {
        onChange(dateToHHMM(selectedDate));
      }
    }
  };

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: getCurrentDate(),
      onChange: handleChange,
      mode: type,
      maximumDate,
      minimumDate,
    });
  };

  return (
    <Box flexDirection="row" alignItems="center" borderRadius="m">
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

      {Platform.select({
        ios: (
          <DateTimePicker
            accentColor={colors.primary}
            value={getCurrentDate()}
            mode={type}
            onChange={handleChange}
            locale={type === "time" ? "de" : undefined}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
          />
        ),
        android: (
          <Box
            backgroundColor="lightGrey2"
            paddingHorizontal="s"
            paddingVertical="xs"
            borderRadius="m"
          >
            <TouchableOpacity
              style={styles.datePicker}
              onPress={openAndroidPicker}
            >
              <Text variant="body" color="darkGrey3">
                {dateTime || t("common.choose")}
              </Text>
            </TouchableOpacity>
          </Box>
        ),
      })}
    </Box>
  );
};

const styles = StyleSheet.create({
  datePicker: {
    justifyContent: "center",
  },
});
