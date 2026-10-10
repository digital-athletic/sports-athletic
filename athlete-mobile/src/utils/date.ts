/**
 * Date Utilities
 *
 * All date-only values (birthdays, season dates, etc.) are treated as calendar dates,
 * not moments in time. They are stored in ISO 8601 format (YYYY-MM-DD).
 *
 * STRATEGY: All Local
 * All functions use local time methods consistently. This keeps things simple -
 * a date string "2024-01-15" becomes local midnight Jan 15, and extracting
 * components from any Date gives the local calendar date.
 *
 * Key principle: A date like "2024-01-15" represents that calendar date
 * in the user's local context.
 */

/** ISO 8601 date string format (YYYY-MM-DD) */
export type ISODateString = string;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Validates that a string is an existing calendar date in ISO 8601 format (YYYY-MM-DD) */
export const isISODate = (value: string): value is ISODateString => {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  // The Date constructor rolls over impossible dates such as 2010-02-31 into the next month
  return date.getMonth() === month - 1 && date.getDate() === day;
};

/** Validates that a Date object is valid (not Invalid Date) */
const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Converts a Date to ISO 8601 date string (YYYY-MM-DD) */
export const formatDateToISO = (date: Date): ISODateString =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/**
 * Parses an ISO 8601 date string (YYYY-MM-DD) to a Date at local midnight.
 */
export const ISODateToDate = (dateString: ISODateString): Date => {
  if (!isISODate(dateString)) {
    throw new Error(
      `Expected ISO 8601 date format (YYYY-MM-DD), got: ${dateString}`,
    );
  }
  // new Date("YYYY-MM-DD") would parse as UTC midnight, so build the date from its local parts
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formats a date for user display in DD.MM.YYYY format.
 */
export const formatDateForDisplay = (date: Date | ISODateString): string => {
  const d = typeof date === "string" ? ISODateToDate(date) : date;

  if (!isValidDate(d)) {
    throw new Error(`Invalid Date: ${d}`);
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}.${month}.${year}`;
};

/**
 * Returns a new Date advanced by the specified number of days.
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
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

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

/**
 * Converts a Date to HH:mm format (24-hour).
 */
export const dateToHHMM = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Creates a Date with today's date and the specified time (HH:mm format).
 */
export const HHMMToDate = (time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Returns a Date one year from now.
 */
export const getDateOneYearFromNow = (): Date => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
};
