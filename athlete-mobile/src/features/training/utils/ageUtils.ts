import { WorkoutConstants } from "@/constants/workoutConstants";
import { DDMMYYYYToDate } from "../../../utils/date";

/**
 * Returns the age group for the given date of birth
 * @param dateOfBirth - Date string in DD-MM-YYYY format
 */
export function ageGroupFor(
  dateOfBirth: string,
): (typeof WorkoutConstants.AGE_GROUPS)[keyof typeof WorkoutConstants.AGE_GROUPS] {
  const now = Date.now();
  const birthDate = DDMMYYYYToDate(dateOfBirth);

  const ageToDate = (age: number, birthday: Date): Date => {
    const date = new Date(birthday);
    const year = date.getFullYear() + age;
    date.setFullYear(year);
    return date;
  };

  const child = ageToDate(WorkoutConstants.AGE_GROUPS_MAX_AGE.CHILD, birthDate);
  const adolescent = ageToDate(
    WorkoutConstants.AGE_GROUPS_MAX_AGE.ADOLESCENT,
    birthDate,
  );

  if (now < child.getTime()) {
    return WorkoutConstants.AGE_GROUPS.CHILD;
  }
  if (now < adolescent.getTime()) {
    return WorkoutConstants.AGE_GROUPS.ADOLESCENT;
  }
  return WorkoutConstants.AGE_GROUPS.ADULT;
}
