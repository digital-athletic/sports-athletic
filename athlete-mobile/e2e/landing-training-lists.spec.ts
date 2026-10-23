import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

/**
 * Returns two team memberships, e.g. teams "U17 Juniors" and "First Team".
 * Registered after mockSupabaseAuth so Playwright's LIFO ordering beats the REST catch all.
 */
async function mockTwoUserTeams(page: Page) {
  await page.route("**/rest/v1/team_members**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ team_id: "team-1" }, { team_id: "team-2" }]),
    });
  });
  await page.route("**/rest/v1/teams**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "team-1", name: "U17 Juniors", owner_id: "trainer-1" },
        { id: "team-2", name: "First Team", owner_id: "trainer-2" },
      ]),
    });
  });
}

test.describe("Home: training lists", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete opens the focus and additional training lists", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await mockTwoUserTeams(page);

    const basePage = new BasePage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();

    const focusButton = page.getByRole("button", {
      name: "Focus & Prevention",
    });
    await expect(focusButton).toBeVisible();
    await focusButton.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: "playwright/screenshots/home-training-shortcuts.png",
      fullPage: true,
    });

    await focusButton.click();
    await expect(
      page.getByRole("button", { name: "Focus-Trainings" }),
    ).toBeVisible();
    await page.screenshot({
      path: "playwright/screenshots/focus-training-list.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: "Imminent Pains" }).click();
    await expect(page.getByText("Shoulder").first()).toBeVisible();
    await page.screenshot({
      path: "playwright/screenshots/prevention-training-tiles.png",
      fullPage: true,
    });

    await page.goto("/");
    await basePage.expectLoggedIn();
    await page.getByRole("button", { name: "Additional trainings" }).click();
    await expect(page.getByText("First Team")).toBeVisible();
    await page.screenshot({
      path: "playwright/screenshots/additional-training-list.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: "U17 Juniors" }).click();
    await expect(
      page.getByText("Currently no workouts available"),
    ).toBeVisible();
    await page.screenshot({
      path: "playwright/screenshots/additional-training-workouts-empty.png",
      fullPage: true,
    });
  });
});
