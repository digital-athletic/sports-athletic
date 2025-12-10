import { SharedConstants } from "@/constants/sharedConstants";
import { Platform } from "react-native";
import { SubscriptionType } from "./Subscription";
import { SubscriptionsConstants } from "./SubscriptionsConstants.ios";

export class SubscriptionHelper {
  static isAllowedForTraining(subscription: SubscriptionType): boolean {
    let isInTrialPeriod = false;
    if (Platform.OS !== "ios") {
      let daysLeft = SubscriptionHelper.getTestPeriodDaysLeft(
        subscription.firstRegistration,
      );
      isInTrialPeriod = daysLeft > -1;
    }
    return subscription.isSubscribed || isInTrialPeriod;
  }

  static getTestPeriodDaysLeft = (firstRegistrationTimestamp: number) => {
    let startTimestamp;
    if (
      SubscriptionsConstants.SUBSCRIPTION_KICKOFF_TIMESTAMP >
      firstRegistrationTimestamp
    ) {
      startTimestamp = SubscriptionsConstants.SUBSCRIPTION_KICKOFF_TIMESTAMP;
    } else {
      startTimestamp = firstRegistrationTimestamp;
    }
    let testPeriodPassed =
      startTimestamp +
      SubscriptionsConstants.TEST_PERIOD_DAYS * SharedConstants.TIME_IN_MS.DAY -
      Date.now();
    return Math.ceil(testPeriodPassed / SharedConstants.TIME_IN_MS.DAY);
  };
}
