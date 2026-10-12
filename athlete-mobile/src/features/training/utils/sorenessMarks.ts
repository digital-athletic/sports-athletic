import type { TemporalDataType } from "@/features/training/models/TemporalData";

export const updateSorenessMarks = (
  _marks: TemporalDataType[],
  _tags: string[],
  _now: number,
): TemporalDataType[] => {
  throw new Error("not implemented");
};

export const dropExpiredMarks = (
  _marks: TemporalDataType[],
  _now: number,
): TemporalDataType[] => {
  throw new Error("not implemented");
};
