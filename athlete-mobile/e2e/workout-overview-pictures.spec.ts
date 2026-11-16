import { expect, test } from "./fixtures";
import { createMissingPictureProfile } from "./mocks/stores/profiles/missingPictureProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { WorkoutPage } from "./pages";

// The profile plans exercise 25 with a picture file and 1204 without one.
const WITH_PICTURE_ID = "25";
const WITHOUT_PICTURE_ID = "1204";

test.describe("Workout overview: exercise pictures", () => {
  test.use({ profile: createMissingPictureProfile(), signedIn: true });

  test("athlete sees a placeholder for a missing and for a failed exercise picture", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await page.route("**/storage/v1/object/public/**", (route) =>
      route.abort(),
    );

    const workoutPage = new WorkoutPage(page);
    await page.goto("/");
    await workoutPage.expectLoggedIn();
    await workoutPage.startWorkout("Tuesday");

    for (const exerciseId of [WITH_PICTURE_ID, WITHOUT_PICTURE_ID]) {
      await expect(
        page.getByTestId(
          `training-overview-exercise-${exerciseId}-picture-placeholder`,
        ),
      ).toBeVisible();
    }
    for (const exerciseId of [WITH_PICTURE_ID, WITHOUT_PICTURE_ID]) {
      await expect(
        page.getByTestId(`training-overview-exercise-${exerciseId}-picture`),
      ).toHaveCount(0);
    }
    await expect(page.getByText("No connection")).toHaveCount(0);
  });
});
