import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { BasePage } from "./pages";

test.describe("Selection tile grid: tablet", () => {
  test.use({
    profile: createCompletedProfile(),
    signedIn: true,
    // Overrides the phone viewport of the project on purpose: this is the tablet scenario.
    viewport: { width: 1024, height: 1366 },
  });

  test("athlete sees four phone sized focus trainings in one row", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();
    expect(page.viewportSize()?.width).toBe(1024);

    await page.getByRole("button", { name: "Focus & Prevention" }).click();
    await page.getByRole("button", { name: /^Focus-Trainings/ }).click();
    await expect(
      page.getByRole("heading", { name: "What do you want to train?" }),
    ).toBeVisible();

    const legAxis = page.getByRole("button", { name: /^Leg Axis Stability/ });
    const foamRoller = page.getByRole("button", { name: /^Foam Roller/ });
    const warmUp = page.getByRole("button", { name: /^Warm-up/ });

    // The fourth tile shares the row with the first, the fifth starts a new row.
    await expect
      .poll(async () => {
        const first = await legAxis.boundingBox();
        const fourth = await foamRoller.boundingBox();
        return first !== null && fourth !== null && first.y === fourth.y;
      })
      .toBe(true);
    const first = await legAxis.boundingBox();
    const fifth = await warmUp.boundingBox();
    expect(fifth?.y).toBeGreaterThan(first?.y ?? Infinity);
    expect(first?.width).toBeLessThanOrEqual(240);
  });
});

test.describe("Selection tile grid: phone", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete sees the training days as half width tiles", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();

    await page
      .getByRole("button", { name: "Start Training" })
      .click({ timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "Which workout do you start?" }),
    ).toBeVisible();

    // Two columns between 20 point screen padding with a 15 point gap.
    const viewportWidth = page.viewportSize()?.width ?? 0;
    const halfCell = Math.floor((viewportWidth - 2 * 20 - 15) / 2);
    const tuesdayTile = page.getByRole("button", { name: /^Tuesday workout/ });
    await expect
      .poll(async () => (await tuesdayTile.boundingBox())?.width)
      .toBe(halfCell);
  });
});
