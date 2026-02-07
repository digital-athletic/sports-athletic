import { type Page } from "@playwright/test";

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
  // Mock signInWithPassword
  await page.route(`**/auth/v1/token?grant_type=password`, async (route) => {
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

  // Mock signUp (auto-confirm: session fields at top level per GoTrue API format)
  await page.route(`**/auth/v1/signup**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...mockSession,
        user: mockUser,
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
}

/**
 * Mock signup that requires email confirmation (no session returned).
 * Includes OTP verification mock that accepts the given code.
 */
export async function mockSignupRequiresConfirmation(
  page: Page,
  email: string,
  validOtpCode = "123456",
) {
  await page.route(`**/auth/v1/signup**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: createMockUser(email), session: null }),
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
}

/**
 * Mock signup with auto-confirmed email (session returned immediately).
 * Also mocks signInWithPassword which is called after auto-confirm.
 */
export async function mockSignupAutoConfirm(page: Page, email: string) {
  const sessionResponse = createMockSessionResponse(email);

  await page.route(`**/auth/v1/signup**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sessionResponse),
    });
  });

  await page.route(`**/auth/v1/token**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sessionResponse),
    });
  });

  await mockSession_(page, email);
  await mockRestApi(page);
}
