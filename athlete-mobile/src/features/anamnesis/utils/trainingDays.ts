export const DAYS_IN_WEEK = 7;
export const MAX_CONSECUTIVE_DAYS_CHILD = 1;
export const MAX_CONSECUTIVE_DAYS_ADULT = 3;

export const getPreviousWeekday = (weekday: number): number => {
  return (weekday + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK;
};

export const getNextWeekday = (weekday: number): number => {
  return (weekday + 1) % DAYS_IN_WEEK;
};

export const getAdjacentWeekday = (
  weekday: number,
  direction: "before" | "after",
): number => {
  return direction === "after"
    ? getNextWeekday(weekday)
    : getPreviousWeekday(weekday);
};

type TrainingDay = { active: boolean };

export const countConsecutiveDays = (
  trainingDays: TrainingDay[],
  weekday: number,
  direction: "before" | "after",
): number => {
  let count = 0;
  let currentWeekday = getAdjacentWeekday(weekday, direction);

  for (let i = 0; i < DAYS_IN_WEEK - 1; i++) {
    if (trainingDays[currentWeekday].active) {
      count++;
      currentWeekday = getAdjacentWeekday(currentWeekday, direction);
    } else {
      break;
    }
  }

  return count;
};

export const validateDaySelection = (
  trainingDays: TrainingDay[],
  weekday: number,
  isChild: boolean,
): boolean => {
  const consecutiveBefore = countConsecutiveDays(
    trainingDays,
    weekday,
    "before",
  );
  const consecutiveAfter = countConsecutiveDays(trainingDays, weekday, "after");
  const totalConsecutiveDays = consecutiveBefore + consecutiveAfter + 1;

  const maxConsecutiveDays = isChild
    ? MAX_CONSECUTIVE_DAYS_CHILD
    : MAX_CONSECUTIVE_DAYS_ADULT;

  return totalConsecutiveDays <= maxConsecutiveDays;
};
