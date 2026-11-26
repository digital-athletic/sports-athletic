import { type MaxValuesType } from "@/features/training/models/MaxValues";
import { type I18nKey } from "@/i18n";
import { type ThemeColor } from "@/theme/theme";

type PowerTestExercise = {
  /** Movement direction whose barbell maximum the exercise measures. */
  direction: keyof Omit<MaxValuesType, "testAt">;
  color: ThemeColor;
  legendKey: I18nKey;
  resultKey: I18nKey;
};

/** The five strength test exercises in chart order, each with its line colour. */
export const POWER_TEST_EXERCISES: readonly PowerTestExercise[] = [
  {
    direction: "kneeDominant",
    color: "squad",
    legendKey: "statistics.powerTest.legendSquad",
    resultKey: "statistics.powerTest.squad",
  },
  {
    direction: "hipHinge",
    color: "deadlift",
    legendKey: "statistics.powerTest.legendDeadlift",
    resultKey: "statistics.powerTest.deadlift",
  },
  {
    direction: "horizontalPush",
    color: "benchPress",
    legendKey: "statistics.powerTest.legendBenchPress",
    resultKey: "statistics.powerTest.benchPress",
  },
  {
    direction: "horizontalPull",
    color: "rowing",
    legendKey: "statistics.powerTest.legendRowing",
    resultKey: "statistics.powerTest.rowing",
  },
  {
    direction: "verticalPush",
    color: "shoulderPress",
    legendKey: "statistics.powerTest.legendShoulderPress",
    resultKey: "statistics.powerTest.shoulderPress",
  },
];
