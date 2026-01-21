import { type Page } from "@playwright/test";

const SUPABASE_URL = "http://localhost:54321";

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

export async function mockSupabaseAuth(page: Page) {
  // Mock signInWithPassword
  await page.route(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockSession,
          user: mockUser,
        }),
      });
    },
  );

  // Mock getSession
  await page.route(`${SUPABASE_URL}/auth/v1/session`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { session: mockSession },
        error: null,
      }),
    });
  });

  // Mock signUp
  await page.route(`${SUPABASE_URL}/auth/v1/signup`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: mockUser,
        session: mockSession,
      }),
    });
  });

  // Mock signOut
  await page.route(`${SUPABASE_URL}/auth/v1/logout`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  // Mock any other Supabase REST API calls
  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}
