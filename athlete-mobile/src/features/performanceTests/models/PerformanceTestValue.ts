import { type ISODateString } from "@/utils/date";

export type PerformanceTestValue = {
  id: string;
  date: ISODateString;
  value: number;
};
