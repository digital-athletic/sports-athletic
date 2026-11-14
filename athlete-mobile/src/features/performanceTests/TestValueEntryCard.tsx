import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { liveRegionProps } from "@/common/announce";
import { DateInputField } from "@/form/DateInputField";
import { TextInputField } from "@/form/TextInputField";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { formatDateToISO } from "@/utils/date";
import { type SportTest } from "./models/SportTest";
import { TestSectionCard, TestSectionTitle } from "./TestSectionCard";
import { isAllowedValueDate, parseTestValue } from "./testValues";

type EntryError = "invalidValue" | "invalidDate";

/** Entry of a new value with its date; a rejected entry shows an error and stores nothing. */
export const TestValueEntryCard: FC<{ test: SportTest; valuesKey: string }> = ({
  test,
  valuesKey,
}) => {
  const { t } = useTranslation();
  const addValue = usePerformanceTestValuesStore((state) => state.addValue);
  const [input, setInput] = useState("");
  const [date, setDate] = useState(() => formatDateToISO(new Date()));
  const [error, setError] = useState<EntryError | null>(null);

  const handleSave = () => {
    const value = parseTestValue(input);
    if (value === null) {
      setError("invalidValue");
      return;
    }
    if (!isAllowedValueDate(date, formatDateToISO(new Date()))) {
      setError("invalidDate");
      return;
    }

    addValue(valuesKey, { date, value });
    setInput("");
    setError(null);
  };

  return (
    <TestSectionCard>
      <TestSectionTitle title={t("more.performanceTests.addValue")} />
      <TextInputField
        title={t("more.performanceTests.valueLabel", { unit: test.unit })}
        placeholder={test.unit}
        value={input}
        onChange={setInput}
        keyboardType="decimal-pad"
        testID="performance-test-value-input"
      />
      <Box>
        <Text variant="label" marginBottom="xs">
          {t("more.performanceTests.dateLabel")}
        </Text>
        <DateInputField
          type="date"
          dateTime={date}
          onChange={setDate}
          maximumDate={new Date()}
          accessibilityLabel={t("more.performanceTests.dateLabel")}
        />
      </Box>
      {error && (
        <Text
          variant="body"
          color="error"
          accessibilityRole="alert"
          testID="performance-test-value-error"
          {...liveRegionProps}
        >
          {t(`more.performanceTests.${error}`)}
        </Text>
      )}
      <Button testID="performance-test-save" onPress={handleSave}>
        {t("more.performanceTests.save")}
      </Button>
    </TestSectionCard>
  );
};
