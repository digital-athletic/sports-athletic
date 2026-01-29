/**
 * ISO 8601 date string format (YYYY-MM-DD)
 * This is the standard format used throughout the application.
 */
export type ISODateString = string;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DDMMYYYY_REGEX = /^\d{2}-\d{2}-\d{4}$/;

const isISODate = (dateString: string) => ISO_DATE_REGEX.test(dateString);
const isDDMMYYYY = (dateString: string) => DDMMYYYY_REGEX.test(dateString);

const isValidDate = (date: Date) => !isNaN(date.getTime());

const isValidDateString = (dateString: string) =>
  isValidDate(new Date(dateString));

/**
 * Converts a Date to ISO 8601 date format (YYYY-MM-DD)
 * This is the standard date format for the application.
 *
 * Uses UTC methods to avoid timezone shifts when the Date was created
 * from a date-only ISO string (which is parsed as UTC midnight).
 */
export const dateToISODate = (
  date: Date | string,
  useUTC = true,
): ISODateString => {
  if (typeof date === "string") {
    if (isISODate(date)) {
      return date;
    }

    // Handle legacy DD-MM-YYYY format
    if (isDDMMYYYY(date)) {
      return convertDDMMYYYYToISO(date);
    }

    if (isValidDateString(date)) {
      return dateToISODate(new Date(date), useUTC);
    }
    throw new Error(
      `f:dateToISODate - Unable to convert ${date} to ISO 8601 date`,
    );
  }

  if (!isValidDate(date)) {
    throw new Error(`f:dateToISODate - Invalid Date: ${date}`);
  }

  // Use UTC methods to avoid timezone shifts for date-only values
  const YYYY = useUTC ? date.getUTCFullYear() : date.getFullYear();
  const MM = (
    "0" +
    ((useUTC ? date.getUTCMonth() : date.getMonth()) + 1)
  ).slice(-2);
  const DD = ("0" + (useUTC ? date.getUTCDate() : date.getDate())).slice(-2);
  return `${YYYY}-${MM}-${DD}`;
};

/**
 * Converts ISO 8601 date string (YYYY-MM-DD) to Date object
 */
export const ISODateToDate = (dateString: string | Date): Date => {
  if (typeof dateString === "string") {
    if (isISODate(dateString)) {
      return new Date(dateString);
    }
    // Handle legacy DD-MM-YYYY format
    if (isDDMMYYYY(dateString)) {
      return new Date(dateString.split("-").reverse().join("-"));
    }
    if (isValidDateString(dateString)) {
      return new Date(dateString);
    }
    throw new Error(
      `f:ISODateToDate - Unable to convert ${dateString} to Date`,
    );
  }

  if (!isValidDate(dateString)) {
    throw new Error(`f:ISODateToDate - Invalid Date: ${dateString}`);
  }

  return dateString;
};

/**
 * Converts DD-MM-YYYY format to ISO 8601 (YYYY-MM-DD) format.
 * Used for migrating legacy date strings.
 */
export const convertDDMMYYYYToISO = (dateString: string): ISODateString => {
  if (!isDDMMYYYY(dateString)) {
    throw new Error(
      `f:convertDDMMYYYYToISO - Expected DD-MM-YYYY format, got: ${dateString}`,
    );
  }
  const [day, month, year] = dateString.split("-");
  return `${year}-${month}-${day}`;
};

/**
 * @deprecated Use dateToISODate instead. DD-MM-YYYY format is being phased out.
 * Converts a Date to DD-MM-YYYY format
 */
export const dateToDDMMYYYY = (date: Date | string): string => {
  if (typeof date === "string") {
    if (isDDMMYYYY(date)) {
      return date;
    }

    if (isValidDateString(date)) {
      return dateToDDMMYYYY(new Date(date));
    }
    throw new Error(
      `f:dateToDDMMYYYY - Unable to convert ${date} to DD-MM-YYYY`,
    );
  }

  if (!isValidDate(date)) {
    throw new Error(`f:dateToDDMMYYYY - Invalid Date: ${date}`);
  }

  const DD = ("0" + date.getDate()).slice(-2);
  const MM = ("0" + (date.getMonth() + 1)).slice(-2);
  const YYYY = date.getFullYear();
  return [DD, MM, YYYY].join("-");
};

/**
 * @deprecated Use ISODateToDate instead. DD-MM-YYYY format is being phased out.
 * Converts DD-MM-YYYY string to Date object
 */
export const DDMMYYYYToDate = (dateString: string | Date): Date => {
  if (typeof dateString === "string") {
    if (isDDMMYYYY(dateString)) {
      return new Date(dateString.split("-").reverse().join("-"));
    }
    if (isValidDateString(dateString)) {
      return new Date(dateString);
    }
    throw new Error(
      `f:DDMMYYYYToDate - Unable to convert ${dateString} to Date`,
    );
  }

  if (!isValidDate(dateString)) {
    throw new Error(`f:DDMMYYYYToDate - Invalid Date: ${dateString}`);
  }

  return dateString;
};

/**
 * Converts a Date to HH:mm format (24-hour)
 */
export const dateToHHMM = (date: Date): string => {
  const hh = ("0" + date.getHours()).slice(-2);
  const mm = ("0" + date.getMinutes()).slice(-2);
  return [hh, mm].join(":");
};

/**
 * Converts HH:MM time string to today's Date with that time
 */
export const HHMMToDate = (time: string): Date => {
  const date = new Date();
  const splitTime = time.split(":");
  date.setMilliseconds(0);
  date.setSeconds(0);
  date.setHours(parseInt(splitTime[0], 10), parseInt(splitTime[1], 10));
  return date;
};

/**
 * Returns a new Date advanced by the specified number of days
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Calculates age from a birthday string in ISO 8601 format (YYYY-MM-DD).
 * Uses UTC to avoid timezone-related date shifts.
 * @returns Age in years, or null if the birthday is invalid
 */
export const calculateAgeFromBirthday = (birthday: string): number | null => {
  if (!isISODate(birthday)) {
    return null;
  }

  const birthDate = new Date(birthday);
  if (!isValidDate(birthDate)) {
    return null;
  }

  const today = new Date();
  // Use UTC methods to avoid timezone shifts
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
