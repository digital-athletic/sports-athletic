const DDMMYYYY_REGEX = /^\d{2}-\d{2}-\d{4}$/;

const isDDMMYYYY = (dateString: string) => DDMMYYYY_REGEX.test(dateString);

const isValidDate = (date: Date) => !isNaN(date.getTime());

const isValidDateString = (dateString: string) =>
  isValidDate(new Date(dateString));

/**
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
