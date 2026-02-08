import { type Page } from "@playwright/test";

/** Intercept all Supabase storage public object requests and return empty responses. */
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

function mockRestApi(page: Page) {
  return page.route(`**/rest/v1/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
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

  // Mock any other Supabase REST API calls
  await page.route(`**/rest/v1/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
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
