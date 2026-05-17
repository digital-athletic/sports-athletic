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
 * Consent Gate E2E Tests
 *
 * Tests the consent gate that blocks authenticated users without a
 * privacy policy acceptance from accessing protected routes.
 *
 * Stack.Protected guards in root layout:
 * - auth + consent accepted  → (tabs), (anamnesis), training
 * - auth + consent missing   → consent screen only (non-bypassable)
 * - auth + consent loading   → spinner (fetch in progress)
 */

const OTP_CODE = "123456";

const AUTH_STORAGE = {
  state: {
    auth: { userId: "mock-user-id-123", token: "mock-access-token" },
    isInitialized: true,
    _hasHydrated: true,
  },
  version: 14,
};

// Supabase derives the storage key as `sb-${hostname}-auth-token` (here: sb-localhost-auth-token).
// Without this entry getSession() returns null, overwriting the seeded Zustand auth to null.
const SUPABASE_SESSION = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: {
    id: "mock-user-id-123",
    email: "test@example.com",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    aud: "authenticated",
    role: "authenticated",
  },
};

async function seedAuthStore(page: Page) {
  await page.addInitScript(
    (args) => {
      localStorage.setItem("auth-storage", JSON.stringify(args.authStorage));
      localStorage.setItem(
        "sb-localhost-auth-token",
        JSON.stringify(args.supabaseSession),
      );
    },
    { authStorage: AUTH_STORAGE, supabaseSession: SUPABASE_SESSION },
  );
}

test.describe("Consent Gate — Missing Consent", () => {
  test.use({ profile: createMissingConsentProfile() });

  async function setup(page: Parameters<typeof mockSupabaseAuth>[0]) {
    await mockSupabaseAuth(page);
    // LIFO priority: overrides the accepted-consent default from mockSupabaseAuth
    await mockMissingConsentUserProfile(page);
    await seedAuthStore(page);
  }

  test("authenticated user with missing consent sees consent screen", async ({
    page,
  }) => {
    await setup(page);
    await page.goto("/");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();

    const sendCodeButton = page.getByRole("button", { name: "Send code" });
    await expect(sendCodeButton).not.toBeVisible({ timeout: 3000 });
  });

  test("consent screen blocks navigation to protected routes", async ({
    page,
  }) => {
    await setup(page);
    await page.goto("/");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });

    await page.goto("/(tabs)/(home)");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Your Training Plan")).not.toBeVisible({
      timeout: 3000,
    });
  });

  test("submitting without accepting privacy shows validation error", async ({
    page,
  }) => {
    await setup(page);
    await page.goto("/");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: /terms and conditions/i }),
    ).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Data Protection")).toBeVisible();
  });

  test("accepting consent removes gate and grants access to the app", async ({
    page,
  }) => {
    await setup(page);
    await page.goto("/");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });

    for (const checkbox of await page.getByRole("checkbox").all()) {
      await checkbox.click();
    }
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 5000,
    });

    const sendCodeButton = page.getByRole("button", { name: "Send code" });
    await expect(sendCodeButton).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Consent Gate — Accepted Consent", () => {
  test.use({ profile: createAcceptedConsentProfile() });

  test("authenticated user with accepted consent goes directly to app", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await seedAuthStore(page);
    await page.goto("/");

    const consentTitle = page.getByText("Data Protection");
    await expect(consentTitle).not.toBeVisible({ timeout: 5000 });

    const sendCodeButton = page.getByRole("button", { name: "Send code" });
    await expect(sendCodeButton).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Consent Gate — Unauthenticated", () => {
  test("unauthenticated user sees onboarding, not consent screen", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
      timeout: 5000,
    });

    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 3000,
    });
  });
});

test.describe("Consent Gate — Login Flow", () => {
  test("user with analytics consent missing sees consent gate after login", async ({
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
  });

  test("user with full existing consent bypasses consent gate after login", async ({
    page,
  }) => {
    await mockOtpFlow(page, "test@example.com", OTP_CODE);

    await new BasePage(page).login("test@example.com");

    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("button", { name: "Send code" }),
    ).not.toBeVisible({ timeout: 3000 });
  });

  test("user with analytics missing can complete consent and access app", async ({
    page,
  }) => {
    await mockOtpFlow(page, "test@example.com", OTP_CODE);
    await mockAnalyticsMissingConsentUserProfile(page);

    await new BasePage(page).login("test@example.com");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });

    for (const checkbox of await page.getByRole("checkbox").all()) {
      await checkbox.click();
    }
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("button", { name: "Send code" }),
    ).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Consent Gate — Cold Start", () => {
  test.use({ profile: createAcceptedConsentProfile() });

  test("stale 'accepted' in localStorage does not bypass server check on cold start", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    // LIFO priority: overrides the accepted-consent default from mockSupabaseAuth
    await mockMissingConsentUserProfile(page);
    await seedAuthStore(page);
    await page.goto("/");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });
});

test.describe("Consent Gate — Cross-User Logout", () => {
  test.use({ profile: createAcceptedConsentProfile() });

  test("consent gate appears for second user with missing consent after first user logs out", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await seedAuthStore(page);
    await page.goto("/");

    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 5000,
    });

    const basePage = new BasePage(page);
    await basePage.logout();
    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
      timeout: 5000,
    });

    // Override verify + profile for User B (LIFO priority)
    await mockOtpVerifyAsUser(page, "mock-user-id-456", "userb@example.com");
    await mockMissingConsentUserProfile(page);

    // navigate: false — already on onboarding after logout; a page reload
    // would restore User A's session from localStorage before User B logs in.
    await basePage.login("userb@example.com", { navigate: false });

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });
});

test.describe("Consent Gate — No Profile Row", () => {
  test("user with no server profile row sees consent gate on login", async ({
    page,
  }) => {
    await mockOtpFlow(page, "test@example.com", OTP_CODE);
    // LIFO priority: overrides the accepted-consent default from mockOtpFlow
    await mockEmptyUserProfiles(page);

    const basePage = new BasePage(page);
    await basePage.login("test@example.com");

    await expect(page.getByText("Data Protection")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });
});
