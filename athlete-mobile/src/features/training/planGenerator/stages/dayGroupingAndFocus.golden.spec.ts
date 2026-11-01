import {
  formatFocusPerDay,
  readDayFocusCases,
} from "@test/simulation/planning/dayFocusTable";
import { assignTrainingDayFocus } from "./dayGroupingAndFocus";

describe("assignTrainingDayFocus against the day focus golden table", () => {
  it.each(
    readDayFocusCases().map((dayFocusCase) => [
      dayFocusCase.name,
      dayFocusCase,
    ]),
  )("matches the case %s", (_, { input, profile, expectedFocusPerDay }) => {
    const groups = assignTrainingDayFocus(input, profile);

    expect(formatFocusPerDay(groups.flat())).toBe(expectedFocusPerDay);
  });
});
