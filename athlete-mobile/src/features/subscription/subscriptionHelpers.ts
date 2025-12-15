import { SubscriptionType } from "@/features/subscription/Subscription";

const TEST_PERIOD_DAYS = 14;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Calculate how many days are left in the test period
 */
export const getTestPeriodDaysLeft = (
  firstRegistrationTimestamp: number,
): number => {
  const testPeriodPassed =
    firstRegistrationTimestamp + TEST_PERIOD_DAYS * DAY_IN_MS - Date.now();

  return Math.ceil(testPeriodPassed / DAY_IN_MS);
};

/**
 * Check if user is allowed to start training (either subscribed or in trial period)
 */
export const isAllowedForTraining = (
  subscription: SubscriptionType,
): boolean => {
  const { isSubscribed } = subscription;
  let isInTrialPeriod = true;

  // TODO: reimplement when subscription concepts are done
  // if (Platform.OS !== "ios") {
  //   const daysLeft = getTestPeriodDaysLeft(firstRegistration);
  //   isInTrialPeriod = daysLeft > -1;
  // }

  return isSubscribed || isInTrialPeriod;
};
