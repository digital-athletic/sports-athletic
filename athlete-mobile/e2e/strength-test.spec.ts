import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createFreshAnamnesisProfile } from "./mocks/stores/profiles/freshAnamnesisProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { BasePage } from "./pages";

/**
 * Completes the strength test workout by skipping warm-ups and entering reps.
 */
async function completeStrengthTestWorkout(page: Page, reps: number) {
  const skipButton = page
    .getByRole("button", { name: "Skip exercise" })
    .first();
  const repsInput = page.locator("input").first();
  const saveButton = page.locator("button", { hasText: /save|speichern/i });
  const resultsPage = page.getByText("Training Evaluation");
  // The barbell notice is a modal; nothing behind it takes clicks until OK.
  const noticeOk = page.getByText("OK", { exact: true });

  const nextStep = resultsPage
    .or(noticeOk)
    .or(repsInput)
    .or(skipButton)
    .first();

  for (let i = 0; i < 50; i++) {
    await nextStep.waitFor({ state: "visible" });

    if (await resultsPage.isVisible()) {
      break;
    }

    if (await noticeOk.isVisible()) {
      await noticeOk.click();
      continue;
    }

    if (await repsInput.isVisible()) {
      await repsInput.fill(String(reps));
      await saveButton.click();
      await repsInput.waitFor({ state: "hidden" });
      continue;
    }

    await skipButton.click({ force: true });
  }
}

test.describe("Strength Test: workout and results", () => {
  test.use({ profile: createFreshAnamnesisProfile(), signedIn: true });

  test("athlete completes the strength test and sees the results", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const basePage = new BasePage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();

    // Navigate to Profile > Start Strength Test
    await basePage.navigateToTab("Profile");
    await expect(page.getByText("Profile").first()).toBeVisible();
    await page.getByText("Start Strength Test").click();

    // Skip muscle soreness selection
    await basePage.skipMuscleSoreness();

    // Start training
    await expect(page.getByText("Training Overview")).toBeVisible();
    await page.getByRole("button", { name: "Start Training" }).click();

    // Complete workout: skip warm-ups, enter 10 reps for strength tests
    await completeStrengthTestWorkout(page, 10);

    // Verify results page
    await expect(page.getByText("Training evaluation")).toBeVisible();
    await expect(
      page.getByText("Your Test Results", { exact: true }),
    ).toBeVisible();

    // Verify exercise tabs are shown
    await expect(page.getByText("Squat").first()).toBeVisible();
    await expect(page.getByText("Deadlift").first()).toBeVisible();
    await expect(page.getByText("Bench press").first()).toBeVisible();
    await expect(page.getByText("Rowing").first()).toBeVisible();
    await expect(page.getByText("Shoulder press").first()).toBeVisible();

    // Verify calculated 1RM values (based on 10 reps with test weights)
    // Formula: weight × (1 + reps/30), then rounded to nearest 0.5 kg
    // All exercises are barbell (LH) now, so weight is used directly
    // Squat: 40kg × 1.333 = 53.33 → 53.5 kg
    await expect(page.getByText("53.5 kg").first()).toBeVisible();
    // Deadlift: 40kg × 1.333 = 53.33 → 53.5 kg
    await expect(page.getByText("53.5 kg").nth(1)).toBeVisible();
    // Bench press: 35kg × 1.333 = 46.67 → 46.5 kg
    await expect(page.getByText("46.5 kg")).toBeVisible();
    // Rowing: 30kg × 1.333 = 40.0 → 40 kg
    // Scoped to results list to avoid ambiguity with chart Y-axis label "40 kg"
    await expect(
      page.getByTestId("power-test-results-list").getByText("40 kg"),
    ).toBeVisible();
    // Shoulder press: 25kg × 1.333 = 33.33 → 33.5 kg
    await expect(page.getByText("33.5 kg")).toBeVisible();

    await page.screenshot({
      path: "playwright/screenshots/strength-test-results.png",
      fullPage: true,
    });
  });
});
