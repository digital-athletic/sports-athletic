import { expect, test } from "./fixtures";
import { mockPersonalDataTables } from "./mocks/personalData";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { ProfilePage } from "./pages";
import { localDate } from "./utils/date";
import { readDownload } from "./utils/download";

test.describe("Account data export", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("an athlete downloads every row the server stores about them as one JSON file", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await mockPersonalDataTables(page);
    const profilePage = new ProfilePage(page);

    await page.goto("/");
    await profilePage.navigateToProfile();
    await profilePage.openAccount();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download my data" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(
      `personal-data_${localDate()}.json`,
    );
    const data = JSON.parse(await readDownload(download));
    expect(data.account.email).toBe("test@example.com");
    expect(data.teamMemberDetails.display_name).toBe("Alex");
    expect(data.teamMemberships[0].team.name).toBe("U17");
    // Activity-only sync: the server stores no exercises for this workout.
    expect(data.workouts).toEqual([
      expect.objectContaining({
        workout_id: "server-workout-1",
        exercises: null,
      }),
    ]);
    expect(data.strengthTests).toEqual([]);
  });
});
