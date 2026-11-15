import { type Sport } from "@/features/training/models/UserWorkoutData";
import { type ISODateString } from "@/utils/date";

/** One value the athlete entered for the test with the code in the sport. */
export type PerformanceTestValue = {
  id: string;
  sport: Sport;
  testCode: string;
  date: ISODateString;
  value: number;
};
