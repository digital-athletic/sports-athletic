import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { BasePage } from "./pages";

test.describe("Custom workouts: generate an own training", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete generates a training from the empty list and starts it from Your trainings", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    await page.goto("/");
    await new BasePage(page).expectLoggedIn();
    await page.getByRole("button", { name: "Additional trainings" }).click();
    await page.getByRole("button", { name: "Your trainings" }).click();
    await expect(
      page.getByText("Currently no workouts available"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Import training" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Generate training" }).click();
    await expect(
      page.getByRole("heading", { name: "Generate training" }),
    ).toBeVisible();
    const generate = page.getByRole("button", {
      name: "Generate training",
      exact: true,
    });
    await expect(generate).toBeDisabled();

    await page.getByRole("radio", { name: "Cardio" }).click();
    await expect(page.getByRole("button", { name: "Upper body" })).toHaveCount(
      0,
    );

    await page.getByRole("radio", { name: "30 min" }).click();
    await page.getByRole("radio", { name: "Hypertrophy" }).click();
    await expect(generate).toBeDisabled();
    await page.getByRole("button", { name: "Upper body" }).click();
    await generate.click();

    const tile = page.getByRole("button", {
      name: "Hypertrophy 30 min",
      exact: true,
    });
    await expect(tile).toBeVisible();
    await expect(page.getByTestId("generate-training-tile")).toBeVisible();
    await expect(page.getByTestId("generate-training-header")).toBeVisible();

    await tile.click();
    await page.getByRole("button", { name: /^At home, \d+ pieces$/ }).click();
    await expect(
      page.getByRole("heading", { name: "Training Overview" }),
    ).toBeVisible({ timeout: 15000 });
  });
});
