import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { liveRegionProps } from "@/common/announce";
import { type Sport } from "@/features/training/models/UserWorkoutData";
import { DateInputField } from "@/form/DateInputField";
import { SegmentedControl } from "@/form/SegmentedControl";
import { TextInputField } from "@/form/TextInputField";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { formatDateToISO } from "@/utils/date";
import { type SportTest } from "./models/SportTest";
import { formatRangeNumber } from "./referenceRange";
import { entryBodyWeight, relativeOneRepMax } from "./strengthTest";
import { TestSectionCard, TestSectionTitle } from "./TestSectionCard";
import { isAllowedValueDate, parseTestValue } from "./testValues";
import { useTestUnit } from "./useTestLabels";

type EntryError = "invalidValue" | "invalidDate";

/** Whether the athlete enters the weight lifted or the value in the test unit. */
type EntryMode = "LIFTED_WEIGHT" | "VALUE";

/** Date of the value; the picker offers no date after today. */
const ValueDateField: FC<{
  date: string;
  onChange: (date: string) => void;
}> = ({ date, onChange }) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Text variant="label" marginBottom="xs">
        {t("more.performanceTests.dateLabel")}
      </Text>
      <DateInputField
        type="date"
        dateTime={date}
        onChange={onChange}
        maximumDate={new Date()}
        accessibilityLabel={t("more.performanceTests.dateLabel")}
      />
    </Box>
  );
};

/** The profile body weight in grey above the lifted weight field. */
const BodyWeightLine: FC<{ bodyWeightKg: number }> = ({ bodyWeightKg }) => {
  const { t, i18n } = useTranslation();

  return (
    <Text
      variant="small"
      color="onSurfaceVariant"
      testID="performance-test-body-weight"
    >
      {t("more.performanceTests.bodyWeight", {
        weight: formatRangeNumber(bodyWeightKg, i18n.language),
      })}
    </Text>
  );
};

/** Switch between the weight lifted and the value in the test unit. */
const EntryModeSwitch: FC<{
  test: SportTest;
  mode: EntryMode;
  onChange: (mode: EntryMode) => void;
}> = ({ test, mode, onChange }) => {
  const { t } = useTranslation();
  const unit = useTestUnit(test);

  return (
    <SegmentedControl<EntryMode>
      accessibilityLabel={t("more.performanceTests.entryMode")}
      value={mode}
      onChange={onChange}
      options={[
        {
          value: "LIFTED_WEIGHT",
          label: t("more.performanceTests.liftedWeight"),
          testID: "performance-test-mode-lifted-weight",
        },
        {
          value: "VALUE",
          label: unit,
          testID: "performance-test-mode-value",
        },
      ]}
    />
  );
};

type ValueFieldLabels = {
  title: string;
  accessibilityLabel: string;
  suffix: string;
};

/** Labels of the value field: the lifted weight in kg with a body weight, the value in the test unit otherwise. */
function useValueFieldLabels(
  test: SportTest,
  bodyWeightKg: number | null,
): ValueFieldLabels {
  const { t } = useTranslation();
  const unit = useTestUnit(test);

  if (bodyWeightKg === null) {
    return {
      title: t("more.performanceTests.value"),
      accessibilityLabel: t("more.performanceTests.valueLabel", { unit }),
      suffix: unit,
    };
  }
  return {
    title: t("more.performanceTests.liftedWeight"),
    accessibilityLabel: t("more.performanceTests.liftedWeightLabel"),
    suffix: t("more.performanceTests.weightUnit"),
  };
}

/** The reason a value was not stored, announced to screen readers. */
const EntryErrorText: FC<{ error: EntryError }> = ({ error }) => {
  const { t } = useTranslation();

  return (
    <Text
      variant="body"
      color="error"
      accessibilityRole="alert"
      testID="performance-test-value-error"
      {...liveRegionProps}
    >
      {t(`more.performanceTests.${error}`)}
    </Text>
  );
};

/** The entry switch when a body weight exists, the body weight line in the weight lifted mode, and the input. */
const ValueField: FC<{
  test: SportTest;
  showModeSwitch: boolean;
  /** The body weight to calculate with, null when the athlete enters the value directly. */
  bodyWeightKg: number | null;
  mode: EntryMode;
  onModeChange: (mode: EntryMode) => void;
  input: string;
  onInputChange: (input: string) => void;
}> = ({
  test,
  showModeSwitch,
  bodyWeightKg,
  mode,
  onModeChange,
  input,
  onInputChange,
}) => {
  const fieldLabels = useValueFieldLabels(test, bodyWeightKg);

  return (
    <>
      {showModeSwitch && (
        <EntryModeSwitch test={test} mode={mode} onChange={onModeChange} />
      )}
      {bodyWeightKg !== null && <BodyWeightLine bodyWeightKg={bodyWeightKg} />}
      <TextInputField
        title={fieldLabels.title}
        accessibilityLabel={fieldLabels.accessibilityLabel}
        placeholder=""
        suffix={fieldLabels.suffix}
        value={input}
        onChange={onInputChange}
        keyboardType="decimal-pad"
        testID="performance-test-value-input"
      />
    </>
  );
};

/**
 * Entry of a new value with its date; a rejected entry shows an error and stores nothing.
 * A strength test with a profile body weight offers a switch: the weight lifted, stored relative to the
 * body weight, or the value in the test unit.
 */
export const TestValueEntryCard: FC<{ test: SportTest; sport: Sport }> = ({
  test,
  sport,
}) => {
  const { t } = useTranslation();
  const addValue = usePerformanceTestValuesStore((state) => state.addValue);
  const profileWeight = useUserProfileStore(
    (state) => state.personalData.weight,
  );
  const availableBodyWeightKg = entryBodyWeight(test, profileWeight);
  const [mode, setMode] = useState<EntryMode>("LIFTED_WEIGHT");
  const bodyWeightKg = mode === "LIFTED_WEIGHT" ? availableBodyWeightKg : null;
  const [input, setInput] = useState("");
  const [date, setDate] = useState(() => formatDateToISO(new Date()));
  const [error, setError] = useState<EntryError | null>(null);

  const handleModeChange = (nextMode: EntryMode) => {
    setMode(nextMode);
    setInput("");
    setError(null);
  };

  const handleSave = () => {
    const entered = parseTestValue(input);
    if (entered === null) {
      setError("invalidValue");
      return;
    }
    if (!isAllowedValueDate(date, formatDateToISO(new Date()))) {
      setError("invalidDate");
      return;
    }

    const value =
      bodyWeightKg === null
        ? entered
        : relativeOneRepMax(entered, bodyWeightKg);
    addValue({ sport, testCode: test.code, date, value });
    setInput("");
    setError(null);
  };

  return (
    <TestSectionCard>
      <TestSectionTitle title={t("more.performanceTests.addValue")} />
      <ValueField
        test={test}
        showModeSwitch={availableBodyWeightKg !== null}
        bodyWeightKg={bodyWeightKg}
        mode={mode}
        onModeChange={handleModeChange}
        input={input}
        onInputChange={setInput}
      />
      <ValueDateField date={date} onChange={setDate} />
      {error && <EntryErrorText error={error} />}
      <Button testID="performance-test-save" onPress={handleSave}>
        {t("more.performanceTests.save")}
      </Button>
    </TestSectionCard>
  );
};
