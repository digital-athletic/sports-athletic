import { expect, test } from "./fixtures";
import { createWorkoutsProfile } from "./mocks/stores/profiles/workoutsProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { StatisticsPage } from "./pages";

test.describe("Statistics tabs: athlete with workouts and a strength test", () => {
  test.use({ profile: createWorkoutsProfile(2), signedIn: true });

  test("switches between the Workouts tab and the Tests tab", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();
    await statsPage.expectHasWorkouts();

    await statsPage.clickTestsTab();
    await statsPage.expectTestsTabVisible();
    await statsPage.expectHasTestResults();
    await statsPage.expectStartTestButtonVisible();
    await statsPage.expectWorkoutsContainerNotVisible();
    // The completed profile seeds one strength test result
    expect(await statsPage.getTestResultsCount()).toBeGreaterThan(0);

    await statsPage.clickWorkoutsTab();
    await statsPage.expectHasWorkouts();
    await expect(page.getByTestId("power-test-container")).not.toBeVisible();
  });
});
