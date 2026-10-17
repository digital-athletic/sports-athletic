import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createAcceptedConsentProfile } from "./mocks/stores/profiles/acceptedConsentProfile";
import { createMissingConsentProfile } from "./mocks/stores/profiles/missingConsentProfile";
import {
  mockAnalyticsMissingConsentUserProfile,
  mockEmptyUserProfiles,
  mockMissingConsentUserProfile,
  mockOtpFlow,
  mockOtpVerifyAsUser,
  mockSupabaseAuth,
} from "./mocks/supabase";
import { BasePage } from "./pages";

/**
 * The consent gate blocks signed in users without a privacy policy
 * acceptance from every protected route (Stack.Protected in the root layout):
 * - signed in, consent accepted: tabs, anamnesis, training
 * - signed in, consent missing: consent screen only
 * - signed in, consent loading: spinner
 */

const OTP_CODE = "123456";

async function acceptAllConsents(page: Page) {
  for (const checkbox of await page.getByRole("checkbox").all()) {
    await checkbox.click();
  }
  await page.getByRole("button", { name: "Continue" }).click();
}

test.describe("Consent Gate: missing consent at app start", () => {
  test.use({ profile: createMissingConsentProfile(), signedIn: true });

  test("consent screen blocks the app until the privacy policy is accepted", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    // LIFO priority: overrides the accepted-consent default from mockSupabaseAuth
    await mockMissingConsentUserProfile(page);
    const consentTitle = page.getByText("Data Protection");

    await page.goto("/");
    await expect(consentTitle).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send code" }),
    ).not.toBeVisible({ timeout: 3000 });

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /agree to the terms/i }),
    ).toBeVisible({ timeout: 3000 });
    await expect(consentTitle).toBeVisible();

    await page.goto("/(tabs)/(home)");
    await expect(consentTitle).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Your Training Plan")).not.toBeVisible({
      timeout: 3000,
    });

    await acceptAllConsents(page);
    await new BasePage(page).expectTrainingPlanVisible();
    await expect(consentTitle).not.toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "Send code" }),
    ).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Consent Gate: accepted consent", () => {
  test.use({ profile: createAcceptedConsentProfile(), signedIn: true });

  test("stale accepted status in localStorage does not bypass the server check on cold start", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await mockMissingConsentUserProfile(page);
    await page.goto("/");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });

  test("user with accepted consent enters the app, then a second user with missing consent sees the gate after logout", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await page.goto("/");

    await basePage.expectLoggedIn();
    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("button", { name: "Send code" }),
    ).not.toBeVisible({ timeout: 3000 });

    await basePage.logout();
    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
      timeout: 5000,
    });

    // Override verify + profile for User B (LIFO priority)
    await mockOtpVerifyAsUser(page, "mock-user-id-456", "userb@example.com");
    await mockMissingConsentUserProfile(page);

    // navigate: false, because the app is already on the login screen after logout.
    await basePage.login("userb@example.com", { navigate: false });

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });
});

test.describe("Consent Gate: login", () => {
  test("user with analytics consent missing sees the gate at login, then completes it", async ({
    page,
  }) => {
    await mockOtpFlow(page, "test@example.com", OTP_CODE);
    // LIFO priority: overrides the accepted-consent default from mockOtpFlow
    await mockAnalyticsMissingConsentUserProfile(page);

    await new BasePage(page).login("test@example.com");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
    await expect(page.getByText("Your Training Plan")).not.toBeVisible({
      timeout: 3000,
    });

    await acceptAllConsents(page);
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible(
      {
        timeout: 5000,
      },
    );
    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("button", { name: "Send code" }),
    ).not.toBeVisible({ timeout: 3000 });
  });

  test("user with full existing consent bypasses the gate at login", async ({
    page,
  }) => {
    await mockOtpFlow(page, "test@example.com", OTP_CODE);

    await new BasePage(page).login("test@example.com");

    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible(
      {
        timeout: 5000,
      },
    );
    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("button", { name: "Send code" }),
    ).not.toBeVisible({ timeout: 3000 });
  });

  test("user without a server profile row sees the gate at login", async ({
    page,
  }) => {
    await mockOtpFlow(page, "test@example.com", OTP_CODE);
    // LIFO priority: overrides the accepted-consent default from mockOtpFlow
    await mockEmptyUserProfiles(page);

    await new BasePage(page).login("test@example.com");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });
});
