import { featureFlags } from "./featureFlags";

describe("featureFlags", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SERVER_SYNC_ENABLED;
    delete process.env.EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED;
    delete process.env.EXPO_PUBLIC_REVIEW_EMAIL;
    delete process.env.EXPO_PUBLIC_REVIEW_OTP;
    delete process.env.EXPO_PUBLIC_ANALYTICS_CONSENT_ENABLED;
    delete process.env.EXPO_PUBLIC_LINK_AGB;
    delete process.env.EXPO_PUBLIC_LINK_PRIVACY;
    delete process.env.EXPO_PUBLIC_LINK_IMPRINT;
    delete process.env.EXPO_PUBLIC_LINK_A11Y_STATEMENT;
    delete process.env.EXPO_PUBLIC_LINK_A11Y_FEEDBACK;
    delete process.env.EXPO_PUBLIC_TRAINING_LIST_VIEW_ENABLED;
    delete process.env.EXPO_PUBLIC_CONTACT_ENABLED;
    delete process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
    delete process.env.EXPO_PUBLIC_AIWL_GENERATOR_ENABLED;
  });

  describe("contactEnabled", () => {
    it("is false when EXPO_PUBLIC_CONTACT_ENABLED and EXPO_PUBLIC_SUPPORT_EMAIL are unset", () => {
      expect(featureFlags.contactEnabled).toBe(false);
    });

    it("is false when EXPO_PUBLIC_SUPPORT_EMAIL is unset", () => {
      process.env.EXPO_PUBLIC_CONTACT_ENABLED = "true";
      expect(featureFlags.contactEnabled).toBe(false);
    });

    it("is false when EXPO_PUBLIC_CONTACT_ENABLED is not 'true'", () => {
      process.env.EXPO_PUBLIC_SUPPORT_EMAIL = "support@example.com";
      expect(featureFlags.contactEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_CONTACT_ENABLED is 'true' and EXPO_PUBLIC_SUPPORT_EMAIL is set", () => {
      process.env.EXPO_PUBLIC_CONTACT_ENABLED = "true";
      process.env.EXPO_PUBLIC_SUPPORT_EMAIL = "support@example.com";
      expect(featureFlags.contactEnabled).toBe(true);
    });
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

  describe("serverSyncActivityOnlyEnabled", () => {
    it("defaults to false when EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED is unset", () => {
      expect(featureFlags.serverSyncActivityOnlyEnabled).toBe(false);
    });

    it("is false when EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED is 'false'", () => {
      process.env.EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED = "false";
      expect(featureFlags.serverSyncActivityOnlyEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED is 'true'", () => {
      process.env.EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED = "true";
      expect(featureFlags.serverSyncActivityOnlyEnabled).toBe(true);
    });
  });

  describe("analyticsConsentEnabled", () => {
    it("defaults to false when EXPO_PUBLIC_ANALYTICS_CONSENT_ENABLED is unset", () => {
      expect(featureFlags.analyticsConsentEnabled).toBe(false);
    });

    it("is false when EXPO_PUBLIC_ANALYTICS_CONSENT_ENABLED is 'false'", () => {
      process.env.EXPO_PUBLIC_ANALYTICS_CONSENT_ENABLED = "false";
      expect(featureFlags.analyticsConsentEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_ANALYTICS_CONSENT_ENABLED is 'true'", () => {
      process.env.EXPO_PUBLIC_ANALYTICS_CONSENT_ENABLED = "true";
      expect(featureFlags.analyticsConsentEnabled).toBe(true);
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

  describe("termsEnabled", () => {
    it("is false when EXPO_PUBLIC_LINK_AGB is unset", () => {
      expect(featureFlags.termsEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_LINK_AGB is set", () => {
      process.env.EXPO_PUBLIC_LINK_AGB = "https://example.com/agb";
      expect(featureFlags.termsEnabled).toBe(true);
    });
  });

  describe("privacyEnabled", () => {
    it("is false when EXPO_PUBLIC_LINK_PRIVACY is unset", () => {
      expect(featureFlags.privacyEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_LINK_PRIVACY is set", () => {
      process.env.EXPO_PUBLIC_LINK_PRIVACY = "https://example.com/privacy";
      expect(featureFlags.privacyEnabled).toBe(true);
    });
  });

  describe("imprintEnabled", () => {
    it("is false when EXPO_PUBLIC_LINK_IMPRINT is unset", () => {
      expect(featureFlags.imprintEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_LINK_IMPRINT is set", () => {
      process.env.EXPO_PUBLIC_LINK_IMPRINT = "https://example.com/imprint";
      expect(featureFlags.imprintEnabled).toBe(true);
    });
  });

  describe("a11yStatementEnabled", () => {
    it("is false when EXPO_PUBLIC_LINK_A11Y_STATEMENT is unset", () => {
      expect(featureFlags.a11yStatementEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_LINK_A11Y_STATEMENT is set", () => {
      process.env.EXPO_PUBLIC_LINK_A11Y_STATEMENT = "https://example.com/a11y";
      expect(featureFlags.a11yStatementEnabled).toBe(true);
    });
  });

  describe("a11yFeedbackEnabled", () => {
    it("is false when EXPO_PUBLIC_LINK_A11Y_FEEDBACK is unset", () => {
      expect(featureFlags.a11yFeedbackEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_LINK_A11Y_FEEDBACK is set", () => {
      process.env.EXPO_PUBLIC_LINK_A11Y_FEEDBACK = "https://example.com/report";
      expect(featureFlags.a11yFeedbackEnabled).toBe(true);
    });
  });

  describe("trainingListViewEnabled", () => {
    it("defaults to false when EXPO_PUBLIC_TRAINING_LIST_VIEW_ENABLED is unset", () => {
      expect(featureFlags.trainingListViewEnabled).toBe(false);
    });

    it("is false when EXPO_PUBLIC_TRAINING_LIST_VIEW_ENABLED is 'false'", () => {
      process.env.EXPO_PUBLIC_TRAINING_LIST_VIEW_ENABLED = "false";
      expect(featureFlags.trainingListViewEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_TRAINING_LIST_VIEW_ENABLED is 'true'", () => {
      process.env.EXPO_PUBLIC_TRAINING_LIST_VIEW_ENABLED = "true";
      expect(featureFlags.trainingListViewEnabled).toBe(true);
    });
  });

  describe("aiwlGeneratorEnabled", () => {
    it("defaults to false when EXPO_PUBLIC_AIWL_GENERATOR_ENABLED is unset", () => {
      expect(featureFlags.aiwlGeneratorEnabled).toBe(false);
    });

    it("is false when EXPO_PUBLIC_AIWL_GENERATOR_ENABLED is 'false'", () => {
      process.env.EXPO_PUBLIC_AIWL_GENERATOR_ENABLED = "false";
      expect(featureFlags.aiwlGeneratorEnabled).toBe(false);
    });

    it("is true when EXPO_PUBLIC_AIWL_GENERATOR_ENABLED is 'true'", () => {
      process.env.EXPO_PUBLIC_AIWL_GENERATOR_ENABLED = "true";
      expect(featureFlags.aiwlGeneratorEnabled).toBe(true);
    });
  });

  describe("isReviewUserId", () => {
    it("returns true for the sentinel review-user ID", () => {
      expect(featureFlags.isReviewUserId("review-user")).toBe(true);
    });

    it("returns false for any other user ID", () => {
      expect(featureFlags.isReviewUserId("real-uuid-1234")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(featureFlags.isReviewUserId("")).toBe(false);
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
