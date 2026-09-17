import { type Page } from "@playwright/test";

/** Intercept Supabase storage public asset requests and return empty assets. */
async function mockSupabaseStorage(page: Page) {
  await page.route("**/storage/v1/object/public/**", async (route) => {
    await route.fulfill({ status: 200, body: "" });
  });
}

const mockUser = {
  id: "mock-user-id-123",
  email: "test@example.com",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: "authenticated",
  role: "authenticated",
};

const mockSession = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: mockUser,
};

function createMockUser(email: string) {
  return { ...mockUser, email };
}

function createMockSessionResponse(email: string) {
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: createMockUser(email),
  };
}

function mockSession_(page: Page, email: string) {
  return page.route(`**/auth/v1/session**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { session: createMockSessionResponse(email) },
        error: null,
      }),
    });
  });
}

const SYNC_TABLES = [
  "user_completed_workouts",
  "user_exercises",
  "strength_tests",
];

function mockRestApi(page: Page) {
  // Mock sync table upserts with proper empty-body 201 response
  for (const table of SYNC_TABLES) {
    page.route(`**/rest/v1/${table}**`, async (route) => {
      const method = route.request().method();
      if (method === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }
    });
  }

  // Catch-all for any other REST API calls
  page.route(`**/rest/v1/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Registered after catch-all so it takes priority (Playwright uses LIFO ordering).
  // Returns consent-accepted so checkAndSetConsent resolves to "accepted" after UI login flows.
  return page.route(`**/rest/v1/user_profiles**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          consent_privacy_accepted: true,
          consent_analytics_accepted: true,
        },
      ]),
    });
  });
}

/**
 * Override user_profiles to return specific consent flags.
 * Must be called AFTER mockSupabaseAuth/mockOtpFlow so Playwright's LIFO route
 * ordering gives this handler priority over the default accepted-consent mock.
 */
async function mockUserProfileConsent(
  page: Page,
  consent: { privacy: boolean; analytics: boolean },
) {
  await page.route(`**/rest/v1/user_profiles**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          consent_privacy_accepted: consent.privacy,
          consent_analytics_accepted: consent.analytics,
        },
      ]),
    });
  });
}

export async function mockMissingConsentUserProfile(page: Page) {
  await mockUserProfileConsent(page, { privacy: false, analytics: false });
}

/** Simulates a brand-new user with no profile row yet. */
export async function mockEmptyUserProfiles(page: Page) {
  await page.route(`**/rest/v1/user_profiles**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

/** Simulates a user who consented to privacy but not analytics. */
export async function mockAnalyticsMissingConsentUserProfile(page: Page) {
  await mockUserProfileConsent(page, { privacy: true, analytics: false });
}

/**
 * Override the OTP verify response to return a session for a specific user.
 * Use mid-test (LIFO priority) to simulate a different user logging in.
 */
export async function mockOtpVerifyAsUser(
  page: Page,
  userId: string,
  email: string,
) {
  await page.route(`**/auth/v1/verify**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...createMockSessionResponse(email),
        user: { ...createMockUser(email), id: userId },
      }),
    });
  });
}

export async function mockSupabaseAuth(page: Page) {
  // Mock signInWithOtp (POST /auth/v1/otp)
  await page.route(`**/auth/v1/otp**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  // Mock verifyOtp — returns a session
  await page.route(`**/auth/v1/verify**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...mockSession,
        user: mockUser,
      }),
    });
  });

  // Mock getSession
  await page.route(`**/auth/v1/session`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { session: mockSession },
        error: null,
      }),
    });
  });

  // Mock signOut - use wildcard to match query params like ?scope=global
  await page.route(`**/auth/v1/logout**`, async (route) => {
    await route.fulfill({
      status: 204,
    });
  });

  // Mock updateUser (PUT /auth/v1/user), used by saveDisplayName
  await page.route(`**/auth/v1/user**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: mockUser }),
    });
  });

  // Mock Supabase REST API calls (sync tables + catch-all)
  await mockRestApi(page);

  // Mock delete_my_account RPC. Registered after mockRestApi so Playwright's
  // LIFO route ordering gives it priority over the /rest/v1/** catch-all.
  await page.route(`**/rest/v1/rpc/delete_my_account`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ deleted: true }),
    });
  });

  // Mock Supabase storage (images, videos, etc.)
  await mockSupabaseStorage(page);
}

/**
 * Mock OTP flow: send code + verify with given OTP code.
 * Used for both login and registration OTP flows.
 */
export async function mockOtpFlow(
  page: Page,
  email: string,
  validOtpCode = "123456",
) {
  // Mock signInWithOtp (POST /auth/v1/otp)
  await page.route(`**/auth/v1/otp**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  await page.route(`**/auth/v1/verify**`, async (route) => {
    const body = route.request().postDataJSON();
    if (body?.token === validOtpCode) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createMockSessionResponse(email)),
      });
    } else {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          error: "invalid_grant",
          error_description: "Token has expired or is invalid",
        }),
      });
    }
  });

  await mockSession_(page, email);
  await mockRestApi(page);
  await mockSupabaseStorage(page);
}
