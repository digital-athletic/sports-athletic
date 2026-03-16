import { featureFlags } from "./featureFlags";

describe("featureFlags", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SERVER_SYNC_ENABLED;
    delete process.env.EXPO_PUBLIC_REVIEW_EMAIL;
    delete process.env.EXPO_PUBLIC_REVIEW_OTP;
  });

  describe("serverSyncEnabled", () => {
    it("defaults to true when EXPO_PUBLIC_SERVER_SYNC_ENABLED is unset", () => {
      expect(featureFlags.serverSyncEnabled).toBe(true);
    });

    it("is false when EXPO_PUBLIC_SERVER_SYNC_ENABLED is 'false'", () => {
      process.env.EXPO_PUBLIC_SERVER_SYNC_ENABLED = "false";
      expect(featureFlags.serverSyncEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_SERVER_SYNC_ENABLED is 'true'", () => {
      process.env.EXPO_PUBLIC_SERVER_SYNC_ENABLED = "true";
      expect(featureFlags.serverSyncEnabled).toBe(true);
    });
  });

  describe("reviewEmail", () => {
    it("is null when EXPO_PUBLIC_REVIEW_EMAIL is unset", () => {
      expect(featureFlags.reviewEmail).toBeNull();
    });

    it("returns the configured value when EXPO_PUBLIC_REVIEW_EMAIL is set", () => {
      process.env.EXPO_PUBLIC_REVIEW_EMAIL = "reviewer@example.com";
      expect(featureFlags.reviewEmail).toBe("reviewer@example.com");
    });
  });

  describe("reviewOtp", () => {
    it("is null when EXPO_PUBLIC_REVIEW_OTP is unset", () => {
      expect(featureFlags.reviewOtp).toBeNull();
    });

    it("returns the configured value when EXPO_PUBLIC_REVIEW_OTP is set", () => {
      process.env.EXPO_PUBLIC_REVIEW_OTP = "123456";
      expect(featureFlags.reviewOtp).toBe("123456");
    });
  });

  describe("isReviewUser", () => {
    it("returns false when reviewEmail is null", () => {
      expect(featureFlags.isReviewUser("reviewer@example.com")).toBe(false);
    });

    it("returns true when email matches EXPO_PUBLIC_REVIEW_EMAIL (case-insensitive)", () => {
      process.env.EXPO_PUBLIC_REVIEW_EMAIL = "reviewer@example.com";
      expect(featureFlags.isReviewUser("REVIEWER@EXAMPLE.COM")).toBe(true);
    });

    it("returns false when email does not match EXPO_PUBLIC_REVIEW_EMAIL", () => {
      process.env.EXPO_PUBLIC_REVIEW_EMAIL = "reviewer@example.com";
      expect(featureFlags.isReviewUser("other@example.com")).toBe(false);
    });

    it("returns true for exact match with EXPO_PUBLIC_REVIEW_EMAIL", () => {
      process.env.EXPO_PUBLIC_REVIEW_EMAIL = "reviewer@example.com";
      expect(featureFlags.isReviewUser("reviewer@example.com")).toBe(true);
    });
  });
});
