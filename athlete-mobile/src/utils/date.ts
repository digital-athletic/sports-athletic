/**
 * Date Utilities
 *
 * All date-only values (birthdays, season dates, etc.) are treated as calendar dates,
 * not moments in time. They are always stored in ISO 8601 format (YYYY-MM-DD) and
 * handled in UTC to avoid timezone-related shifts.
 *
 * Key principle: A date like "2024-01-15" represents that calendar date everywhere,
 * regardless of the user's timezone.
 */

/** ISO 8601 date string format (YYYY-MM-DD) */
export type ISODateString = string;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Validates that a string matches ISO 8601 date format (YYYY-MM-DD) */
export const isISODate = (value: string): value is ISODateString =>
  ISO_DATE_REGEX.test(value);

/** Validates that a Date object is valid (not Invalid Date) */
const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Converts a Date to ISO 8601 date string (YYYY-MM-DD) using UTC */
export const dateToISODate = (date: Date): ISODateString =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;

/**
 * Parses an ISO 8601 date string (YYYY-MM-DD) to a Date at UTC midnight.
 * The returned Date represents the calendar date in UTC.
 */
export const ISODateToDate = (dateString: ISODateString): Date => {
  if (!isISODate(dateString)) {
    throw new Error(
      `Expected ISO 8601 date format (YYYY-MM-DD), got: ${dateString}`,
    );
  }

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

/**
 * Formats a date for user display in DD.MM.YYYY format.
 * Uses UTC to ensure the displayed date matches the stored calendar date.
 */
export const formatDateForDisplay = (date: Date | ISODateString): string => {
  const d = typeof date === "string" ? ISODateToDate(date) : date;

  if (!isValidDate(d)) {
    throw new Error(`Invalid Date: ${d}`);
  }

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();

  return `${day}.${month}.${year}`;
};

/**
 * Returns a new Date advanced by the specified number of days.
 * Operates in UTC to maintain calendar date semantics.
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

/**
 * Calculates age in years from an ISO 8601 birthday string.
 * @returns Age in years, or null if the birthday is invalid
 */
export const calculateAgeFromBirthday = (
  birthday: ISODateString,
): number | null => {
  if (!isISODate(birthday)) {
    return null;
  }

  const birthDate = ISODateToDate(birthday);
  const today = new Date();

  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getUTCDate() < birthDate.getUTCDate())
  ) {
    age--;
  }

  return age;
};

/**
 * Converts a Date to HH:mm format (24-hour, local time).
 * Time values use local time as they represent times of day in the user's context.
 */
export const dateToHHMM = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Creates a Date with today's date and the specified time (HH:mm format).
 * Uses local time as times represent moments in the user's day.
 */
export const HHMMToDate = (time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};
