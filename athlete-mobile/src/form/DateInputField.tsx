import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import {
  formatDateToISO,
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
 * Default lower bound for date pickers. Without an explicit minimumDate the
 * native Android picker clamps selections at the Unix epoch (1970-01-01),
 * making earlier birthdays unselectable. Providing a real floor avoids this.
 */
const DEFAULT_MIN_DATE = new Date(1920, 0, 1);

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
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const iconName = type === "date" ? "calendar" : "time";

  // Only date pickers need the floor; time pickers have no lower bound.
  const effectiveMinimumDate =
    minimumDate ?? (type === "date" ? DEFAULT_MIN_DATE : undefined);

  // Parse existing dateTime or use current date
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
        onChange(formatDateToISO(selectedDate));
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
      minimumDate: effectiveMinimumDate,
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
            locale={i18n.language}
            maximumDate={maximumDate}
            minimumDate={effectiveMinimumDate}
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
