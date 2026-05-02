import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createAcceptedConsentProfile } from "./mocks/stores/profiles/acceptedConsentProfile";
import { createMissingConsentProfile } from "./mocks/stores/profiles/missingConsentProfile";
import {
  mockMissingConsentUserProfile,
  mockSupabaseAuth,
} from "./mocks/supabase";

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

const AUTH_STORAGE = {
  state: {
    auth: { userId: "mock-user-id-123", token: "mock-access-token" },
    isInitialized: true,
    _hasHydrated: true,
  },
  version: 14,
};

// Supabase JS v2 derives its storage key as `sb-${hostname}-auth-token`.
// With EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321 the key is sb-localhost-auth-token.
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
    // Override user_profiles after mockSupabaseAuth so LIFO ordering gives this
    // handler priority — keeps checkAndSetConsent resolving to "missing".
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

    // Onboarding and home screens must NOT be visible
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

    // Attempt direct navigation to tabs — should remain on consent screen
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

    // Press continue without ticking the checkbox
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: /terms and conditions/i }),
    ).toBeVisible({ timeout: 3000 });
    // Still on consent screen
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

    // Accept all consent checkboxes (privacy + optional analytics) and submit
    for (const checkbox of await page.getByRole("checkbox").all()) {
      await checkbox.click();
    }
    await page.getByRole("button", { name: "Continue" }).click();

    // Consent screen must disappear
    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 5000,
    });

    // User must land in the protected app area, not onboarding
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

    // Consent screen must NOT appear
    const consentTitle = page.getByText("Data Protection");
    await expect(consentTitle).not.toBeVisible({ timeout: 5000 });

    // Onboarding must NOT appear either
    const sendCodeButton = page.getByRole("button", { name: "Send code" });
    await expect(sendCodeButton).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Consent Gate — Unauthenticated", () => {
  test("unauthenticated user sees onboarding, not consent screen", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    // No seedAuthStore — user is not logged in
    await page.goto("/");

    // Should reach onboarding
    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible({
      timeout: 5000,
    });

    // Consent screen must NOT appear for unauthenticated users
    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 3000,
    });
  });
});
