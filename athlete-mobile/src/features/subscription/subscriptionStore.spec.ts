import { act, renderHook } from "@testing-library/react-native";
import {
  DEFAULT_SUBSCRIPTION_DATA,
  type SubscriptionType,
} from "./Subscription";
import { useSubscriptionStore } from "./subscriptionStore";

describe("useSubscriptionStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useSubscriptionStore.setState({
      subscription: DEFAULT_SUBSCRIPTION_DATA,
    });
  });

  // ============================================================================
  // User Subscription Tests
  // ============================================================================

  describe("setUserSubscription", () => {
    it("should set user subscription with all fields", () => {
      const { result } = renderHook(() => useSubscriptionStore());
      const userSubscription: SubscriptionType = {
        isSubscribed: true,
        firstRegistration: 1000,
        packageId: 1,
        expirationTimestamp: 5000,
      };

      act(() => {
        result.current.setUserSubscription(userSubscription);
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
      expect(result.current.subscription.firstRegistration).toBe(1000);
      expect(result.current.subscription.packageId).toBe(1);
      expect(result.current.subscription.expirationTimestamp).toBe(5000);
    });

    it("should set user subscription with required fields only", () => {
      const { result } = renderHook(() => useSubscriptionStore());
      const userSubscription: SubscriptionType = {
        isSubscribed: true,
        firstRegistration: 2000,
      };

      act(() => {
        result.current.setUserSubscription(userSubscription);
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
      expect(result.current.subscription.firstRegistration).toBe(2000);
      expect(result.current.subscription.packageId).toBeUndefined();
      expect(result.current.subscription.expirationTimestamp).toBeUndefined();
    });

    it("should update subscription from unsubscribed to subscribed", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: false,
          firstRegistration: 1000,
        });
      });

      expect(result.current.subscription.isSubscribed).toBe(false);

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
          packageId: 2,
        });
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
      expect(result.current.subscription.packageId).toBe(2);
    });

    it("should preserve optional fields if provided", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
          packageId: 1,
          expirationTimestamp: 5000,
        });
      });

      expect(result.current.subscription.packageId).toBe(1);
      expect(result.current.subscription.expirationTimestamp).toBe(5000);
    });

    it("should handle subscription with no optional fields", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 3000,
        });
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
      expect(result.current.subscription.firstRegistration).toBe(3000);
      expect(result.current.subscription.packageId).toBeUndefined();
      expect(result.current.subscription.expirationTimestamp).toBeUndefined();
    });
  });

  // ============================================================================
  // Package ID Tests
  // ============================================================================

  describe("setPackageId", () => {
    it("should set package ID", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setPackageId(1);
      });

      expect(result.current.subscription.packageId).toBe(1);
    });

    it("should update package ID", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setPackageId(1);
      });
      expect(result.current.subscription.packageId).toBe(1);

      act(() => {
        result.current.setPackageId(2);
      });
      expect(result.current.subscription.packageId).toBe(2);
    });

    it("should handle different package IDs", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setPackageId(999);
      });

      expect(result.current.subscription.packageId).toBe(999);
    });

    it("should not affect other subscription properties", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
        });
        result.current.setPackageId(5);
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
      expect(result.current.subscription.firstRegistration).toBe(1000);
      expect(result.current.subscription.packageId).toBe(5);
    });
  });

  // ============================================================================
  // First Registration Tests
  // ============================================================================

  describe("setFirstRegistration", () => {
    it("should set first registration timestamp", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setFirstRegistration(1234567890);
      });

      expect(result.current.subscription.firstRegistration).toBe(1234567890);
    });

    it("should update first registration timestamp", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setFirstRegistration(1000);
      });
      expect(result.current.subscription.firstRegistration).toBe(1000);

      act(() => {
        result.current.setFirstRegistration(2000);
      });
      expect(result.current.subscription.firstRegistration).toBe(2000);
    });

    it("should handle zero as first registration", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setFirstRegistration(0);
      });

      expect(result.current.subscription.firstRegistration).toBe(0);
    });

    it("should not affect other subscription properties", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
          packageId: 3,
        });
        result.current.setFirstRegistration(5000);
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
      expect(result.current.subscription.packageId).toBe(3);
      expect(result.current.subscription.firstRegistration).toBe(5000);
    });
  });

  // ============================================================================
  // Subscription Status Tests
  // ============================================================================

  describe("setIsSubscribed", () => {
    it("should set subscription status to true", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setIsSubscribed(true);
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
    });

    it("should set subscription status to false", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setIsSubscribed(false);
      });

      expect(result.current.subscription.isSubscribed).toBe(false);
    });

    it("should toggle subscription status", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setIsSubscribed(true);
      });
      expect(result.current.subscription.isSubscribed).toBe(true);

      act(() => {
        result.current.setIsSubscribed(false);
      });
      expect(result.current.subscription.isSubscribed).toBe(false);

      act(() => {
        result.current.setIsSubscribed(true);
      });
      expect(result.current.subscription.isSubscribed).toBe(true);
    });

    it("should not affect other subscription properties", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: false,
          firstRegistration: 1000,
          packageId: 2,
          expirationTimestamp: 5000,
        });
        result.current.setIsSubscribed(true);
      });

      expect(result.current.subscription.firstRegistration).toBe(1000);
      expect(result.current.subscription.packageId).toBe(2);
      expect(result.current.subscription.expirationTimestamp).toBe(5000);
      expect(result.current.subscription.isSubscribed).toBe(true);
    });
  });

  // ============================================================================
  // Reset Tests
  // ============================================================================

  describe("resetSubscription", () => {
    // TODO: default state is currently incorrect (and not persisted) due to a lack of a subscription concept
    it.skip("should reset subscription to default state", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
          packageId: 5,
          expirationTimestamp: 9999,
        });
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
      expect(result.current.subscription.packageId).toBe(5);

      act(() => {
        result.current.resetSubscription();
      });

      expect(result.current.subscription).toEqual(DEFAULT_SUBSCRIPTION_DATA);
      expect(result.current.subscription.isSubscribed).toBe(false);
      expect(result.current.subscription.firstRegistration).toBe(0);
      expect(result.current.subscription.packageId).toBeUndefined();
      expect(result.current.subscription.expirationTimestamp).toBeUndefined();
    });

    it("should reset after multiple updates", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setIsSubscribed(true);
        result.current.setFirstRegistration(1000);
        result.current.setPackageId(3);
      });

      act(() => {
        result.current.resetSubscription();
      });

      expect(result.current.subscription).toEqual(DEFAULT_SUBSCRIPTION_DATA);
    });

    it("should clear all optional fields on reset", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 5000,
          packageId: 10,
          expirationTimestamp: 20000,
        });
      });

      act(() => {
        result.current.resetSubscription();
      });

      expect(result.current.subscription.packageId).toBeUndefined();
      expect(result.current.subscription.expirationTimestamp).toBeUndefined();
    });

    it("should allow setting new subscription after reset", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
          packageId: 5,
        });
      });

      act(() => {
        result.current.resetSubscription();
      });

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 2000,
          packageId: 3,
        });
      });

      expect(result.current.subscription.firstRegistration).toBe(2000);
      expect(result.current.subscription.packageId).toBe(3);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("Integration scenarios", () => {
    it("should handle complete subscription lifecycle", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      // User registers
      act(() => {
        result.current.setUserSubscription({
          isSubscribed: false,
          firstRegistration: 1000,
        });
      });

      expect(result.current.subscription.isSubscribed).toBe(false);
      expect(result.current.subscription.firstRegistration).toBe(1000);

      // User subscribes
      act(() => {
        result.current.setIsSubscribed(true);
        result.current.setPackageId(1);
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
          packageId: 1,
          expirationTimestamp: 5000,
        });
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
      expect(result.current.subscription.packageId).toBe(1);
      expect(result.current.subscription.expirationTimestamp).toBe(5000);

      // User updates subscription
      act(() => {
        result.current.setPackageId(2);
      });

      expect(result.current.subscription.packageId).toBe(2);
    });

    it("should maintain state across multiple independent updates", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setFirstRegistration(1000);
      });

      act(() => {
        result.current.setIsSubscribed(true);
      });

      act(() => {
        result.current.setPackageId(2);
      });

      expect(result.current.subscription.firstRegistration).toBe(1000);
      expect(result.current.subscription.isSubscribed).toBe(true);
      expect(result.current.subscription.packageId).toBe(2);
    });

    it("should handle subscription upgrade scenario", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      // Initial basic subscription
      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
          packageId: 1,
          expirationTimestamp: 10000,
        });
      });

      expect(result.current.subscription.packageId).toBe(1);

      // Upgrade to premium
      act(() => {
        result.current.setPackageId(2);
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
          packageId: 2,
          expirationTimestamp: 20000,
        });
      });

      expect(result.current.subscription.packageId).toBe(2);
      expect(result.current.subscription.expirationTimestamp).toBe(20000);
    });

    it("should maintain independent state for multiple hooks", () => {
      const { result: hook1 } = renderHook(() => useSubscriptionStore());
      const { result: hook2 } = renderHook(() => useSubscriptionStore());

      // Both hooks share same store
      act(() => {
        hook1.current.setIsSubscribed(true);
      });

      expect(hook2.current.subscription.isSubscribed).toBe(true);

      act(() => {
        hook2.current.setPackageId(5);
      });

      expect(hook1.current.subscription.packageId).toBe(5);
    });

    it("should handle frequent subscription updates", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        for (let i = 1; i <= 10; i++) {
          result.current.setPackageId(i);
        }
      });

      expect(result.current.subscription.packageId).toBe(10);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge cases", () => {
    it("should handle very large timestamp values", () => {
      const { result } = renderHook(() => useSubscriptionStore());
      const largeTimestamp = Number.MAX_SAFE_INTEGER;

      act(() => {
        result.current.setFirstRegistration(largeTimestamp);
      });

      expect(result.current.subscription.firstRegistration).toBe(
        largeTimestamp,
      );
    });

    it("should handle large package IDs", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setPackageId(999999);
      });

      expect(result.current.subscription.packageId).toBe(999999);
    });

    it("should preserve state when setting same value twice", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setIsSubscribed(true);
        result.current.setIsSubscribed(true);
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
    });

    it("should handle rapid successive state changes", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setIsSubscribed(true);
        result.current.setIsSubscribed(false);
        result.current.setIsSubscribed(true);
        result.current.setIsSubscribed(false);
      });

      expect(result.current.subscription.isSubscribed).toBe(false);
    });

    it("should handle setting subscription data multiple times", () => {
      const { result } = renderHook(() => useSubscriptionStore());

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
        });
      });

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
          packageId: 1,
        });
      });

      act(() => {
        result.current.setUserSubscription({
          isSubscribed: true,
          firstRegistration: 1000,
          packageId: 1,
          expirationTimestamp: 5000,
        });
      });

      expect(result.current.subscription.isSubscribed).toBe(true);
      expect(result.current.subscription.firstRegistration).toBe(1000);
      expect(result.current.subscription.packageId).toBe(1);
      expect(result.current.subscription.expirationTimestamp).toBe(5000);
    });
  });
});
