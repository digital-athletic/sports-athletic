/**
 * Converts a Date to DD-MM-YYYY format
 */
export const dateToDDMMYYYY = (date: Date | string): string => {
  if (typeof date === "string" && date.length === 10) {
    // assume this is already DD-MM-YYYY
    return date;
  }
  const dateObj = date instanceof Date ? date : new Date(date);
  const DD = ("0" + dateObj.getDate()).substr(-2);
  const MM = ("0" + (dateObj.getMonth() + 1)).substr(-2);
  const YYYY = dateObj.getFullYear();
  return [DD, MM, YYYY].join("-");
};

/**
 * Converts DD-MM-YYYY string to Date object
 */
export const DDMMYYYYToDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) {
    return dateString;
  }
  return new Date(dateString.split("-").reverse().join("-"));
};

/**
 * Converts a Date to HH:mm format (24-hour)
 */
export const dateToHHMM = (date: Date): string => {
  const hh = ("0" + date.getHours()).substr(-2);
  const mm = ("0" + date.getMinutes()).substr(-2);
  return [hh, mm].join(":");
};

/**
 * Converts HH:MM time string to today's Date with that time
 */
export const HHMMToDate = (time: string): Date => {
  const date = new Date();
  const splitTime = time.split(":");
  date.setHours(parseInt(splitTime[0], 10), parseInt(splitTime[1], 10));
  return date;
};
