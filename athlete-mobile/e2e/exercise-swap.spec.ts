import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { mockWakeLock } from "./mocks/wakeLock";
import { WorkoutPage } from "./pages";

const SWAP_PREFIX = "Swap exercise ";

/** Names of the exercises with a swap button, in screen order. */
async function readSwappableNames(page: Page): Promise<string[]> {
  const labels = await page
    .getByRole("button", { name: new RegExp(`^${SWAP_PREFIX}`) })
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label") ?? ""),
    );
  return labels.map((label) => label.slice(SWAP_PREFIX.length));
}

/** Taps the swap button of an exercise and returns the name that replaced it. */
async function swap(page: Page, name: string): Promise<string> {
  const before = await readSwappableNames(page);
  const index = before.indexOf(name);
  await page.getByRole("button", { name: `${SWAP_PREFIX}${name}` }).click();
  await expect
    .poll(async () => (await readSwappableNames(page))[index])
    .not.toBe(name);
  const after = await readSwappableNames(page);
  return after[index];
}

/** Branch IDs of the stored Tuesday training, one list per plan section. */
async function readTuesdayBranchIds(page: Page): Promise<string[][]> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("user-workout-storage");
    const plan = raw ? JSON.parse(raw).state.trainingPlan : null;
    return (plan?.sections ?? []).map(
      (section: {
        trainings: {
          weekday: number;
          skills: Record<string, { branchId: string }[]>;
        }[];
      }) =>
        Object.values(
          section.trainings.find(({ weekday }) => weekday === 1)?.skills ?? {},
        ).flatMap((branches) => branches.map(({ branchId }) => branchId)),
    );
  });
}

/** Indexes of the sections whose Tuesday branches differ. */
const changedSections = (before: string[][], after: string[][]): number[] =>
  after.flatMap((ids, index) =>
    ids.join() === before[index]?.join() ? [] : [index],
  );

test.describe("Training overview: swap an exercise", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete cycles through alternatives and keeps the chosen exercise in the plan", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await mockSupabaseAuth(page);
    await mockWakeLock(page);

    const workoutPage = new WorkoutPage(page);
    await page.goto("/");
    await workoutPage.expectLoggedIn();
    await workoutPage.startWorkout("Tuesday");

    const [original] = await readSwappableNames(page);
    expect(original).toBeTruthy();
    const swapButton = page.getByRole("button", {
      name: `${SWAP_PREFIX}${original}`,
    });
    await swapButton.scrollIntoViewIfNeeded();

    const seen = [original];
    let current = await swap(page, original);
    while (current !== original && seen.length <= 4) {
      seen.push(current);
      current = await swap(page, current);
    }
    expect(current).toBe(original);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen.length).toBeLessThanOrEqual(4);

    const chosen = await swap(page, original);
    expect(chosen).toBe(seen[1]);
    const branchesBefore = await readTuesdayBranchIds(page);

    await workoutPage.beginWorkout();
    await expect(page).toHaveURL(/training-active/);

    await expect
      .poll(async () =>
        changedSections(branchesBefore, await readTuesdayBranchIds(page)),
      )
      .toHaveLength(1);
    const branchesAfter = await readTuesdayBranchIds(page);
    const [section] = changedSections(branchesBefore, branchesAfter);
    expect(branchesAfter[section]).toHaveLength(branchesBefore[section].length);
    expect(
      branchesAfter[section].filter(
        (id) => !branchesBefore[section].includes(id),
      ),
    ).toHaveLength(1);
  });
});
