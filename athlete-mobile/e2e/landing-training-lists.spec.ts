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

  test("athlete sees the shortcuts and opens the additional training list", async ({
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
    await expect(
      page.getByRole("button", { name: "Import training" }),
    ).toHaveCount(0);
    await page.screenshot({
      path: "playwright/screenshots/additional-training-workouts-empty.png",
      fullPage: true,
    });
  });
});

test.describe("Home: focus and prevention choice", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete opens the choice from home and then the prevention training selection", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);

    const basePage = new BasePage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();

    await page.getByRole("button", { name: "Focus & Prevention" }).click();
    await expect(
      page.getByRole("heading", { name: "Focus & Prevention" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Short trainings next to your plan. Pick what you need today.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Focus-Trainings/ }),
    ).toBeVisible();
    await page.screenshot({
      path: "playwright/screenshots/focus-prevention-choice.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: /^Imminent Pains/ }).click();
    await expect(page.getByText("Shoulder").first()).toBeVisible();
    await page.screenshot({
      path: "playwright/screenshots/prevention-training-tiles.png",
      fullPage: true,
    });
  });
});

// The web build draws a 63pt header and no safe areas. The portrait heights
// subtract the room the taller iOS header and the home indicator take on each
// phone; the landscape widths subtract the side safe areas.
const PHONE_SCREENS = [
  { name: "small android", width: 360, height: 640 },
  { name: "iphone se", width: 375, height: 667 },
  { name: "iphone mini", width: 375, height: 737 },
  { name: "iphone 17", width: 402, height: 787 },
  { name: "iphone pro max", width: 440, height: 869 },
];

const LANDSCAPE_PHONE_SCREENS = [
  { name: "iphone se", width: 667, height: 375 },
  { name: "iphone 17", width: 750, height: 402 },
];

for (const screen of LANDSCAPE_PHONE_SCREENS) {
  test.describe(`Home: ${screen.name} landscape screen`, () => {
    test.use({
      profile: createCompletedProfile(),
      signedIn: true,
      viewport: { width: screen.width, height: screen.height },
    });

    test("athlete sees the start button first and scrolls to the shortcut tiles", async ({
      page,
    }) => {
      await mockSupabaseAuth(page);
      await page.goto("/");
      await new BasePage(page).expectLoggedIn();

      await expect(
        page.getByRole("button", { name: "Start Training" }),
      ).toBeInViewport({ ratio: 0.99 });
      await page.screenshot({
        path: `playwright/screenshots/home-${screen.name.replaceAll(" ", "-")}-landscape.png`,
      });

      const additionalButton = page.getByRole("button", {
        name: "Additional trainings",
      });
      await additionalButton.scrollIntoViewIfNeeded();
      await expect(additionalButton).toBeInViewport({ ratio: 0.99 });
      await expect(
        page.getByText(
          "My trainings or trainings created by the coaching team",
        ),
      ).toBeInViewport();
    });
  });
}

for (const screen of PHONE_SCREENS) {
  test.describe(`Home: ${screen.name} screen`, () => {
    test.use({
      profile: createCompletedProfile(),
      signedIn: true,
      viewport: { width: screen.width, height: screen.height },
    });

    test("athlete sees the start button and both shortcut tiles without scrolling", async ({
      page,
    }) => {
      await mockSupabaseAuth(page);
      await page.goto("/");
      await new BasePage(page).expectLoggedIn();

      // A ratio below 1 absorbs subpixel rounding at the tile edge.
      await expect(
        page.getByRole("button", { name: "Start Training" }),
      ).toBeInViewport({ ratio: 0.99 });
      await expect(
        page.getByRole("button", { name: "Focus & Prevention" }),
      ).toBeInViewport({ ratio: 0.99 });
      await expect(
        page.getByRole("button", { name: "Additional trainings" }),
      ).toBeInViewport({ ratio: 0.99 });
      await expect(
        page.getByText(
          "Targeted trainings for stability, mobility and prevention",
        ),
      ).toBeInViewport();
      await page.screenshot({
        path: `playwright/screenshots/home-${screen.name.replaceAll(" ", "-")}.png`,
      });
    });
  });
}
