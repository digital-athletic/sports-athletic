import { addDays, formatDateToISO, ISODateToDate } from "@/utils/date";
import { TrainingSectionType } from "../models/TrainingSection";

/**
 * Minimum section interface for extension logic.
 * Allows the function to work with both strict TrainingSectionType and schema types.
 */
type SectionLike = {
  start: string;
  numOfWeeks: number;
};

/**
 * Result of extending training plan sections due to missed workouts.
 */
export type ExtendedSectionsResult<T extends SectionLike> = {
  sections: T[];
  additionalWeeks: number;
};

/**
 * Extends all section start dates when user has missed multiple weeks of training.
 * Also clips the last section's duration to preserve the season end date.
 *
 * @param sections - Training plan sections with ISO 8601 date strings (YYYY-MM-DD)
 * @param daysSinceLastWorkout - Days since the user's last workout
 * @returns New sections array with extended dates (immutable - original not modified)
 */
export const extendSectionsForMissedWeeks = <T extends SectionLike>(
  sections: readonly T[],
  daysSinceLastWorkout: number,
): ExtendedSectionsResult<T> => {
  if (daysSinceLastWorkout <= 7) {
    return { sections: [...sections], additionalWeeks: 0 };
  }

  const additionalWeeks = Math.floor(daysSinceLastWorkout / 7);

  const extendedSections = sections.map((sec, index, arr) => {
    const curr = ISODateToDate(sec.start);
    const extended = addDays(curr, additionalWeeks * 7);

    // Clip last section by number of added weeks
    const isLastSection = index === arr.length - 1;
    const numOfWeeks = isLastSection
      ? Math.max(0, sec.numOfWeeks - additionalWeeks)
      : sec.numOfWeeks;

    return {
      ...sec,
      start: formatDateToISO(extended),
      numOfWeeks,
    };
  });

  return { sections: extendedSections, additionalWeeks };
};

export const getIntensityForSection = (
  sectionType: TrainingSectionType["type"],
): number => {
  switch (sectionType) {
    case "SWR1":
    case "SWR1KG":
      return 6;
    case "SWR2":
    case "SWR2KG":
      return 7;
    case "SA":
    case "SAKG":
      return 8;
    case "SK":
    case "SKKG":
      return 9;
    case "MAX":
    case "MAX_STRENGTH":
      return 10;
    default:
      return 10;
  }
};
