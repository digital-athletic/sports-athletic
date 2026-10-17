import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createIncompleteAnamnesisProfile } from "./mocks/stores/profiles/incompleteAnamnesisProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

/**
 * Root layout guards (Stack.Protected): protected routes need a signed in
 * user, the onboarding route needs a signed out user.
 */
test.describe("Auth Flow: signed out user", () => {
  test("is sent to the login screen from every route", async ({ page }) => {
    await mockSupabaseAuth(page);
    const sendCodeButton = page.getByRole("button", { name: "Send code" });

    await page.goto("/");
    await expect(sendCodeButton).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("E-Mail")).toBeVisible();
    await expect(page.getByText(/sign up/i)).toBeVisible();
    await expect(page.getByText("Data Protection")).not.toBeVisible({
      timeout: 3000,
    });

    for (const route of [
      "/onboarding",
      "/(tabs)/(home)",
      "/(anamnesis)/anamnesis",
      "/training",
    ]) {
      await page.goto(route);
      await expect(sendCodeButton).toBeVisible();
    }
  });

  test("signs in with an emailed code and lands on the anamnesis start", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);

    await new BasePage(page).login("test@example.com");

    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible(
      {
        timeout: 5000,
      },
    );
  });
});

test.describe("Auth Flow: signed in user", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("reaches the tabs and is kept off the onboarding route", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);

    await page.goto("/");
    await expect(page).toHaveURL("/");
    await basePage.expectLoggedIn();
    await basePage.expectTrainingPlanVisible();
    await expect(page.getByRole("tab", { name: /training/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /statistics/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /profile/i })).toBeVisible();

    await page.goto("/(tabs)/(home)");
    await basePage.expectTrainingPlanVisible();

    await page.goto("/onboarding");
    await basePage.expectTrainingPlanVisible();
    await expect(
      page.getByRole("button", { name: "Send code" }),
    ).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Auth Flow: signed in user without stored consent", () => {
  // No seeded settings store, so the consent status starts as "loading"
  // and stays there until the held profile request is released.
  test.use({ signedIn: true });

  test("shows a spinner while the consent status loads", async ({ page }) => {
    await mockSupabaseAuth(page);
    let releaseProfile = () => {};
    const profileHeld = new Promise<void>((resolve) => {
      releaseProfile = resolve;
    });
    await page.route("**/rest/v1/user_profiles**", async (route) => {
      await profileHeld;
      await route.fallback();
    });

    await page.goto("/");
    await expect(page.locator('[role="progressbar"]')).toBeVisible();

    releaseProfile();
    await expect(
      page.getByRole("button", { name: "Get started" }),
    ).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).not.toBeVisible();
  });
});

test.describe("Auth Flow: signed in user without anamnesis", () => {
  test.use({ profile: createIncompleteAnamnesisProfile(), signedIn: true });

  test("can open the anamnesis route", async ({ page }) => {
    await mockSupabaseAuth(page);

    await page.goto("/(anamnesis)/anamnesis");

    await expect(page.getByText(/I am Ingemar/)).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("button", { name: "Send code" }),
    ).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Auth Flow: session persistence", () => {
  test.use({ signedIn: true });

  test("stays signed in after a page reload", async ({ page }) => {
    await mockSupabaseAuth(page);

    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Get started" }),
    ).toBeVisible();
    await page.reload();

    await expect(
      page.getByRole("button", { name: "Get started" }),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Send code");
  });
});
