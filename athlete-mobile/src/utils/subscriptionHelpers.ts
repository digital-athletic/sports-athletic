import { Platform } from "react-native";

const SUBSCRIPTION_KICKOFF_TIMESTAMP = 1593561600000; // 01-07-2020
const TEST_PERIOD_DAYS = 14;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Calculate how many days are left in the test period
 */
export const getTestPeriodDaysLeft = (
  firstRegistrationTimestamp: number,
): number => {
  const startTimestamp =
    SUBSCRIPTION_KICKOFF_TIMESTAMP > firstRegistrationTimestamp
      ? SUBSCRIPTION_KICKOFF_TIMESTAMP
      : firstRegistrationTimestamp;

  const testPeriodPassed =
    startTimestamp + TEST_PERIOD_DAYS * DAY_IN_MS - Date.now();

  return Math.ceil(testPeriodPassed / DAY_IN_MS);
};

/**
 * Check if user is allowed to start training (either subscribed or in trial period)
 */
export const isAllowedForTraining = (
  isSubscribed: boolean,
  firstRegistration: number,
): boolean => {
  let isInTrialPeriod = false;

  if (Platform.OS !== "ios") {
    const daysLeft = getTestPeriodDaysLeft(firstRegistration);
    isInTrialPeriod = daysLeft > -1;
  }

  return isSubscribed || isInTrialPeriod;
};
