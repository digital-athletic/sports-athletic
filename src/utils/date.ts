export const dateToDDMMYYYY = (date: Date) => {
  const DD = ("0" + date.getDate()).substr(-2);
  const MM = ("0" + (date.getMonth() + 1)).substr(-2);
  const YYYY = date.getFullYear();
  return [DD, MM, YYYY].join("-");
};
