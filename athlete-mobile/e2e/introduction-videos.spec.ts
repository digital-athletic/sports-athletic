import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { ProfilePage } from "./pages";

test.describe("Introduction videos: opening a technique video", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("athlete opens a video from the list and returns to the list", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const profilePage = new ProfilePage(page);
    await page.goto("/");
    await profilePage.expectLoggedIn();
    await profilePage.navigateToProfile();
    await page.getByText("Introduction videos", { exact: true }).click();

    // The list holds rows only; the player lives on the page of one video.
    await expect(page.getByText("Bench press")).toBeVisible();
    await expect(page.getByTestId("video-frame")).toHaveCount(0);

    await page.getByRole("button", { name: "Push Up" }).click();
    await expect(page.getByRole("heading", { name: "Push Up" })).toBeVisible();
    await expect(page.getByTestId("video-frame")).toBeVisible();

    await page.goBack();
    await expect(page.getByText("Bench press")).toBeVisible();
    await expect(page.getByTestId("video-frame")).toHaveCount(0);
  });
});
