import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { TrainingListPage, TrainingOverviewPage, WorkoutPage } from "./pages";

// Removes the browser share sheet and records clipboard writes, because
// headless browsers differ in both.
const recordClipboardOnly = async (page: Page) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          Object.assign(window, { copiedText: text });
        },
      },
    });
  });
};

const readCopiedText = (page: Page): Promise<string> =>
  page.evaluate(() => String(Reflect.get(window, "copiedText")));

test.describe("Workout share: checklist", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete copies the running workout as text from the checklist", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await mockWakeLock(page);
    await recordClipboardOnly(page);
    const workoutPage = new WorkoutPage(page);
    const trainingOverviewPage = new TrainingOverviewPage(page);
    const trainingListPage = new TrainingListPage(page);

    await page.goto("/");
    await workoutPage.expectLoggedIn();
    await workoutPage.startWorkout("Tuesday");
    await trainingOverviewPage.startAsChecklist();
    await trainingListPage.expectVisible();

    await trainingListPage.shareWorkout();

    await expect(
      page.getByText(
        "The workout is copied. You can paste it into your notes.",
      ),
    ).toBeVisible();
    const text = await readCopiedText(page);
    expect(text).toMatch(/^Workout \d{1,2}\/\d{1,2}\/\d{4}/);
    // The first set is lighter, so each set gets its own line.
    expect(text).toContain(
      [
        "KH-Frontkniebeuge",
        "   Set 1: 8 repetitions, 10.00 kg",
        "   Set 2: 8 repetitions, 14.00 kg",
        "   Set 3: 8 repetitions, 14.00 kg",
      ].join("\n"),
    );
  });
});
