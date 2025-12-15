import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  DEFAULT_SUBSCRIPTION_DATA,
  type SubscriptionType,
} from "./Subscription";

interface SubscriptionState {
  // State
  subscription: SubscriptionType;

  // Actions
  setUserSubscription: (userSubscription: SubscriptionType) => void;
  setPackageId: (packageId: number) => void;
  setFirstRegistration: (firstRegistration: number) => void;
  setIsSubscribed: (isSubscribed: boolean) => void;
  resetSubscription: () => void;
}

// TODO: removed persistence of subscription data for now. add persistence back when subscription concepts are done
export const useSubscriptionStore = create<SubscriptionState>()(
  immer(
    (set) => ({
      subscription: DEFAULT_SUBSCRIPTION_DATA,
      setUserSubscription: (userSubscription: SubscriptionType) =>
        set((state) => {
          const {
            isSubscribed,
            firstRegistration,
            packageId,
            expirationTimestamp,
          } = userSubscription;

          state.subscription.isSubscribed = isSubscribed;
          state.subscription.firstRegistration = firstRegistration;

          if (packageId) {
            state.subscription.packageId = packageId;
          }
          if (expirationTimestamp) {
            state.subscription.expirationTimestamp = expirationTimestamp;
          }
        }),
      setPackageId: (packageId: number) =>
        set((state) => {
          state.subscription.packageId = packageId;
        }),
      setFirstRegistration: (firstRegistration: number) =>
        set((state) => {
          state.subscription.firstRegistration = firstRegistration;
        }),
      setIsSubscribed: (isSubscribed: boolean) =>
        set((state) => {
          state.subscription.isSubscribed = isSubscribed;
        }),
      resetSubscription: () => set({ subscription: DEFAULT_SUBSCRIPTION_DATA }),
    }),
    // {
    //   name: "subscription-store",
    //   storage: asyncStorage,
    // },
  ),
);
