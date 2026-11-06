import { expect, test } from "./fixtures";
import { createEndedPlanProfile } from "./mocks/stores/profiles/endedPlanProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { AnamnesisPage, WorkoutPage } from "./pages";
import { getUserWorkoutStorageState } from "./utils/storage";

test.describe("New plan: after the old plan ended", () => {
  test.use({ profile: createEndedPlanProfile(), signedIn: true });

  test("athlete keeps the suggested values and gets a plan from the next Monday", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    // Friday 30 October. The last day of the seeded plan was Sunday 27 September.
    await page.clock.setFixedTime(new Date(2026, 9, 30, 10));

    const anamnesisPage = new AnamnesisPage(page);
    await page.goto("/");
    await anamnesisPage.expectLoggedIn();
    await page.getByText("Your training phase has ended").click();
    await anamnesisPage.acceptSuggestedPlanValues();

    await anamnesisPage.expectLoggedIn();
    await expect(
      page.getByRole("button", { name: /Start.*Training/i }),
    ).toBeVisible();
    await expect(
      page.getByText("Your training phase has ended"),
    ).not.toBeVisible();

    const { workoutData, trainingPlan } =
      await getUserWorkoutStorageState(page);
    expect(workoutData.seasonPhase.endDate).toBe("2027-01-22");
    expect(trainingPlan.sections[0].start).toBe("2026-11-02");
    expect(
      trainingPlan.sections.reduce(
        (weeks: number, section: { numOfWeeks: number }) =>
          weeks + section.numOfWeeks,
        0,
      ),
    ).toBe(11);

    // The last workout is five weeks old. A training gap question would block this step.
    await new WorkoutPage(page).startWorkout("Tuesday");
  });
});
