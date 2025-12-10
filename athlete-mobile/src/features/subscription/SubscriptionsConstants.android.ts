import { SharedConstants } from "@/constants/sharedConstants";

export class SubscriptionsConstantsAndroid {
  static SUBSCRIPTION_KICKOFF_TIMESTAMP = 1593561600000; // 01-07-2020
  static ENTITLEMENT_IDENTIFIER = "Abo"; // set in revenue cat settings
  static TEST_PERIOD_DAYS = 14;
  static PRICE_12_MONTHS = "69,99";
  static PRICE_12_MONTHS_PER_MONTH = "5,83";
  static PRICE_1_MONTH = "7,99";
  static PACKAGES = {
    MONTHLY: {
      identifier: "athletik_handball",
      title: "1_MONTH",
      priceText: "PRICE_PER_MONTH",
      priceValue: SubscriptionsConstantsAndroid.PRICE_1_MONTH,
      payNowPriceText: "PRICE_PER_MONTH",
      payNowPriceValue: SubscriptionsConstantsAndroid.PRICE_1_MONTH,
      subText: "SUBTEXT_1_MONTH",
      subTextValue: null,
      flagText: null,
      duration: SharedConstants.TIME_IN_MS.MONTH,
    },
    YEARLY: {
      identifier: "athletik_handball_jahresabo",
      title: "12_MONTHS",
      priceText: "PRICE_PER_MONTH",
      priceValue: SubscriptionsConstantsAndroid.PRICE_12_MONTHS_PER_MONTH,
      payNowPriceText: "PRICE_PER_YEAR",
      payNowPriceValue: SubscriptionsConstantsAndroid.PRICE_12_MONTHS,
      subText: "SUBTEXT_12_MONTHS",
      subTextValue: SubscriptionsConstantsAndroid.PRICE_12_MONTHS,
      flagText: "FLAG_TEXT_BEST_DEAL",
      duration: SharedConstants.TIME_IN_MS.YEAR,
    },
  } as const;
}
