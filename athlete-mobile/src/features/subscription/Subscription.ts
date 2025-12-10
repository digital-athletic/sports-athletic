export type SubscriptionType = {
  packageId?: number;
  firstRegistration: number;
  isSubscribed: boolean;
  expirationTimestamp?: number;
};

export const DEFAULT_SUBSCRIPTION_DATA: SubscriptionType = {
  firstRegistration: 0,
  isSubscribed: false,
};
