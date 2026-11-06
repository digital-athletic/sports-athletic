import { expect, test } from "./fixtures";
import { createEndedPlanProfile } from "./mocks/stores/profiles/endedPlanProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { AnamnesisPage } from "./pages";

test.describe("New plan: after the old plan ended", () => {
  test.use({ profile: createEndedPlanProfile(), signedIn: true });

  test("athlete keeps the suggested values and gets a plan from the next Monday", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    // Friday 30 October, the seeded plan ended on 28 September.
    await page.clock.setFixedTime(new Date(2026, 9, 30, 10));

    const anamnesisPage = new AnamnesisPage(page);
    await page.goto("/");
    await page.getByText("Your training phase has ended").click();
    await anamnesisPage.acceptSuggestedPlanValues();

    await expect(
      page.getByRole("button", { name: /Start.*Training/i }),
    ).toBeVisible();
    await expect(
      page.getByText("Your training phase has ended"),
    ).not.toBeVisible();

    const seasonPhase = await anamnesisPage.getStoredSeasonPhase();
    expect(seasonPhase?.endDate).toBe("2027-01-22");

    const plan = await anamnesisPage.getStoredTrainingPlan();
    expect(plan?.sections[0].start).toBe("2026-11-02");
    expect(
      plan?.sections.reduce((weeks, section) => weeks + section.numOfWeeks, 0),
    ).toBe(11);
  });
});
