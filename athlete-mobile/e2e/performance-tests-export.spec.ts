import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createHandballWingProfile } from "./mocks/stores/profiles/handballWingProfile";
import { type MockSportTestRow, mockSportTests } from "./mocks/sportTests";
import { mockSupabaseAuth } from "./mocks/supabase";
import { ProfilePage } from "./pages";
import { localDate } from "./utils/date";
import { readDownload } from "./utils/download";

const SPRINT_5M_ROW: MockSportTestRow = {
  id: "55555555-5555-4555-8555-555555555555",
  code: "SPRINT_5M",
  unit: "s",
  category: "SPEED",
  translations: { en: { name: "5 m sprint" } },
  sport_test_reference_values: [],
};

const openPerformanceTests = async (page: Page): Promise<void> => {
  await mockSupabaseAuth(page);
  await mockSportTests(page, [SPRINT_5M_ROW]);
  const profilePage = new ProfilePage(page);
  await page.goto("/");
  await profilePage.expectLoggedIn();
  await profilePage.navigateToProfile();
  await page.getByText("Performance tests", { exact: true }).click();
  await expect(page.getByText("5 m sprint")).toBeVisible();
};

test.describe("Performance tests export", () => {
  test.use({ profile: createHandballWingProfile(14), signedIn: true });

  test("athlete records a result and downloads it as CSV", async ({ page }) => {
    await openPerformanceTests(page);
    await page.getByTestId("performance-test-row-SPRINT_5M").click();
    await page.getByTestId("performance-test-value-input").fill("8,1");
    await page.getByTestId("performance-test-save").click();
    await expect(
      page.getByTestId("performance-test-summary").getByText("8.1 s"),
    ).toBeVisible();
    await page.goBack();

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("performance-tests-export-button").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(
      `performance-tests_${localDate()}.csv`,
    );
    const content = await readDownload(download);
    expect(content.charCodeAt(0)).toBe(0xfeff);
    expect(content.slice(1).split("\r\n")).toEqual([
      "Date,Sport,Test,Value,Unit",
      `${localDate()},Handball,5 m sprint,8.1,s`,
      "",
    ]);
  });

  test("athlete without a result sees a message instead of a file", async ({
    page,
  }) => {
    await openPerformanceTests(page);
    let downloaded = false;
    page.on("download", () => {
      downloaded = true;
    });

    await page.getByTestId("performance-tests-export-button").click();

    await expect(
      page.getByText("You have not recorded a performance test result yet."),
    ).toBeVisible();
    expect(downloaded).toBe(false);
  });
});
