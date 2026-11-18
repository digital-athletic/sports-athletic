import { type CsvField } from "@/utils/csv";
import { type Sport } from "@/features/training/models/UserWorkoutData";
import { formatDateToISO } from "@/utils/date";
import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import { type SportTest } from "./models/SportTest";
import { resolveTestName, resolveTestUnit } from "./testTranslations";
import { sortNewestFirst } from "./testValues";

export type PerformanceTestRowsInput = {
  values: PerformanceTestValue[];
  tests: SportTest[];
  language: string;
  sportLabel: (sport: Sport) => string;
};

/**
 * One row of date, sport, test name, value and unit per value, oldest first. A test missing from the tests
 * shows its code and no unit.
 */
export function toPerformanceTestRows({
  values,
  tests,
  language,
  sportLabel,
}: PerformanceTestRowsInput): CsvField[][] {
  const testsByCode = new Map(tests.map((test) => [test.code, test]));

  return sortNewestFirst(values)
    .reverse()
    .map(({ date, sport, testCode, value }) => {
      const test = testsByCode.get(testCode);
      return [
        date,
        sportLabel(sport),
        test ? resolveTestName(test, language) : testCode,
        value,
        test ? resolveTestUnit(test, language) : null,
      ];
    });
}

/** The file name with the local date, e.g. "performance-tests_2026-11-08.csv". */
export function buildPerformanceTestsFileName(today: Date): string {
  return `performance-tests_${formatDateToISO(today)}.csv`;
}
