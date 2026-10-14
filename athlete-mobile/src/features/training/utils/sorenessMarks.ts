import { SharedConstants } from "@/constants/sharedConstants";
import type { TemporalDataType } from "@/features/training/models/TemporalData";

/** Marks that stay keep their timestamps; new marks expire 24 hours from now. */
export const updateSorenessMarks = (
  marks: TemporalDataType[],
  tags: string[],
  now: number,
): TemporalDataType[] =>
  tags.map(
    (tag) =>
      marks.find((mark) => mark.tag === tag) ?? {
        tag,
        date: new Date(now).toISOString(),
        expiration: new Date(
          now + SharedConstants.TIME_IN_MS.DAY,
        ).toISOString(),
      },
  );

export const dropExpiredMarks = (
  marks: TemporalDataType[],
  now: number,
): TemporalDataType[] =>
  marks.filter((mark) => new Date(mark.expiration).valueOf() > now);
