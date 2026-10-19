import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createWorkoutsProfile } from "./mocks/stores/profiles/workoutsProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { StatisticsPage } from "./pages";

const localDate = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

test.describe("Statistics export: athlete with workouts", () => {
  test.use({ profile: createWorkoutsProfile(2), signedIn: true });

  test("downloads the workouts of the selected range as CSV", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();
    await statsPage.expectHasWorkouts();
    await statsPage.expectExportEnabled();

    const download = await statsPage.exportCsv();
    expect(download.suggestedFilename()).toBe(
      `workouts_total_${localDate()}.csv`,
    );

    const content = await statsPage.readDownload(download);
    expect(content.charCodeAt(0)).toBe(0xfeff);
    const lines = content.slice(1).split("\r\n");
    // Header, one row per performed set of both workouts, trailing line end
    expect(lines).toHaveLength(6);
    expect(lines[0]).toBe(
      "Workout ID,Date,Exercise ID,Exercise,Skill,Set,Sets,Repetitions,Weight (kg),Weight type,Weight (% F-Max),Duration (s),Height (cm),Difficulty",
    );
    expect(lines.slice(1, 5).map((line) => line.split(",")[0])).toEqual([
      "workout-2",
      "workout-2",
      "workout-1",
      "workout-1",
    ]);
    expect(lines[1]).toMatch(
      /^workout-2,[\dT:-]+,118,KH-Frontkniebeuge,SWR1,3,3,10,14,Per dumbbell,,,,$/,
    );
    expect(lines[5]).toBe("");
  });

  test("names the strength test file after the active tab and range", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();
    await statsPage.clickTestsTab();
    await statsPage.expectHasTestResults();
    await statsPage.selectTimeScale("Last year");
    await statsPage.expectExportEnabled();

    const download = await statsPage.exportCsv();
    expect(download.suggestedFilename()).toBe(
      `strength-tests_year_${localDate()}.csv`,
    );
  });
});

test.describe("Statistics export: athlete without workouts", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("disables the export button", async ({ page }) => {
    await mockSupabaseAuth(page);
    const statsPage = new StatisticsPage(page);

    await statsPage.openStatisticsTab();
    await statsPage.expectEmptyState();

    await statsPage.expectExportDisabled();
  });
});
