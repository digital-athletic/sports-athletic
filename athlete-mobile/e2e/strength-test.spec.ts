import { expect, test, type Page } from "@playwright/test";
import { mockSupabaseAuth } from "./mocks/supabase";

/**
 * Completes the strength test workout by skipping warm-ups and entering reps.
 * Skips all exercises except strength tests, where it enters the specified reps.
 */
async function completeStrengthTestWorkout(page: Page, reps: number) {
  const skipButton = page.locator('[aria-label="play-forward"]').first();
  const repsInput = page.locator("input").first();
  const saveButton = page.locator("button", { hasText: /save|speichern/i });
  const resultsPage = page.getByText("Training Evaluation");

  // ~5 warm-ups + 4 exercises × 3 sets = ~25-30 iterations max
  for (let i = 0; i < 50; i++) {
    await Promise.race([
      resultsPage.waitFor({ state: "visible", timeout: 5000 }),
      repsInput.waitFor({ state: "visible", timeout: 5000 }),
      skipButton.waitFor({ state: "visible", timeout: 5000 }),
    ]).catch(() => {});

    if (await resultsPage.isVisible().catch(() => false)) {
      break;
    }

    if (await repsInput.isVisible().catch(() => false)) {
      await repsInput.fill(String(reps));
      await saveButton.click();
      await repsInput.waitFor({ state: "hidden", timeout: 5000 });
      continue;
    }

    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click({ force: true });
    }
  }
}

test.describe("Strength Test", () => {
  test("complete strength test workflow", async ({ page }) => {
    test.setTimeout(60000);

    await mockSupabaseAuth(page);

    // Login
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
    await page.getByPlaceholder("E-Mail").fill("test@example.com");
    await page.getByPlaceholder("Password").fill("password123");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("Your Training Plan")).toBeVisible();

    // Navigate to Profile > Start New Test Workout
    await page.getByRole("tab", { name: /Profile/i }).click();
    await expect(page.getByText("Profile").first()).toBeVisible();
    await page.getByText("Start New Test Workout").click();

    // Skip muscle soreness selection
    await expect(page.getByText("Muscle soreness")).toBeVisible();
    await page.getByRole("button", { name: "Go on" }).click();

    // Start training
    await expect(page.getByText("Training Overview")).toBeVisible();
    await page.getByRole("button", { name: "Start Training" }).click();

    // Complete workout: skip warm-ups, enter 10 reps for strength tests
    await completeStrengthTestWorkout(page, 10);

    // Verify results page
    await expect(page.getByText("Training evaluation")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText("Your Test Results", { exact: true }),
    ).toBeVisible();

    // Verify exercise tabs are shown
    await expect(page.getByText("Squat").first()).toBeVisible();
    await expect(page.getByText("Bench press").first()).toBeVisible();
    await expect(page.getByText("Rowing").first()).toBeVisible();
    await expect(page.getByText("Shoulder press").first()).toBeVisible();

    // Verify calculated 1RM values (based on 10 reps with test weights)
    // Formula: weight × (1 + reps/30), then rounded to nearest 0.5 kg
    // Squat: 35kg × 1.333 = 46.67 → 46.5 kg
    await expect(page.getByText("46.5 kg")).toBeVisible();
    // Bench press: (12.5kg × 2 × 1.1) × 1.333 = 36.67 → 36.5 kg
    await expect(page.getByText("36.5 kg").first()).toBeVisible();
    // Rowing: same as bench → 36.5 kg (second occurrence)
    await expect(page.getByText("36.5 kg").nth(1)).toBeVisible();
    // Shoulder press: (9kg × 2 × 1.1) × 1.333 = 26.4 → 26.5 kg
    await expect(page.getByText("26.5 kg")).toBeVisible();

    // Take screenshot of results
    await page.screenshot({
      path: "playwright/screenshots/strength-test-results.png",
      fullPage: true,
    });
  });
});
