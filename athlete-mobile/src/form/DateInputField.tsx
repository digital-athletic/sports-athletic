import IconCalendar from "@tabler/icons-react-native/IconCalendar";
import IconClock from "@tabler/icons-react-native/IconClock";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import {
  formatDateToISO,
  dateToHHMM,
  ISODateToDate,
  HHMMToDate,
  isISODate,
} from "@/utils/date";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { FieldShell } from "./FieldShell";

interface DateInputFieldProps {
  type: "date" | "time";
  dateTime?: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  accessibilityLabel?: string;
}

/**
 * Default lower bound for date pickers. Without an explicit minimumDate the
 * native Android picker clamps selections at the Unix epoch (1970-01-01),
 * making earlier birthdays unselectable. Providing a real floor avoids this.
 */
const DEFAULT_MIN_DATE = new Date(1920, 0, 1);

interface WebDateInputProps
  extends Pick<
    DateInputFieldProps,
    "type" | "onChange" | "accessibilityLabel"
  > {
  value?: string;
  min?: string;
  max?: string;
}

/**
 * Only a complete value inside min and max reaches onChange, because the
 * browser reports "" for an incomplete date and does not stop typed dates
 * outside the limits. On blur the field shows the last valid value again.
 */
const WebDateInput: FC<WebDateInputProps> = ({
  type,
  value,
  min,
  max,
  onChange,
  accessibilityLabel,
}) => {
  const { colors, textVariants } = useTheme();
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (newValue: string) => {
    setDraft(newValue);
    const isComplete = type === "date" ? isISODate(newValue) : newValue !== "";
    const isInsideLimits =
      (!min || newValue >= min) && (!max || newValue <= max);
    if (isComplete && isInsideLimits) onChange(newValue);
  };

  return (
    <input
      type={type}
      value={draft ?? value ?? ""}
      min={min}
      max={max}
      aria-label={accessibilityLabel}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={() => setDraft(null)}
      style={{
        border: "none",
        background: "transparent",
        color: colors.darkGrey3,
        fontFamily: "system-ui",
        fontSize: textVariants.body.fontSize,
      }}
    />
  );
};

/**
 * Date/Time picker input field
 */
export const DateInputField: FC<DateInputFieldProps> = ({
  type,
  dateTime,
  onChange,
  maximumDate,
  minimumDate,
  accessibilityLabel,
}) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const icon = type === "date" ? IconCalendar : IconClock;

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

  const getDisplayValue = (): string => {
    if (!dateTime) return t("common.choose");
    if (type === "time") return dateTime;

    return ISODateToDate(dateTime).toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const displayValue = (
    <Text variant="body" color="onSurface">
      {getDisplayValue()}
    </Text>
  );

  return (
    <FieldShell icon={icon}>
      <Box flex={1} paddingHorizontal="s" alignItems="flex-start">
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
              accessibilityLabel={accessibilityLabel}
            />
          ),
          android: (
            <TouchableOpacity
              style={styles.datePicker}
              onPress={openAndroidPicker}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
            >
              {displayValue}
            </TouchableOpacity>
          ),
          web: (
            <Box paddingHorizontal="xs">
              <WebDateInput
                type={type}
                value={dateTime}
                min={
                  effectiveMinimumDate && formatDateToISO(effectiveMinimumDate)
                }
                max={maximumDate && formatDateToISO(maximumDate)}
                onChange={onChange}
                accessibilityLabel={accessibilityLabel}
              />
            </Box>
          ),
        })}
      </Box>
    </FieldShell>
  );
};

const styles = StyleSheet.create({
  datePicker: {
    alignSelf: "stretch",
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 5,
  },
});
