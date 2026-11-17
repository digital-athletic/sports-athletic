import { expect, test } from "./fixtures";
import { createHandballWingProfile } from "./mocks/stores/profiles/handballWingProfile";
import { type MockSportTestRow, mockSportTests } from "./mocks/sportTests";
import { mockSupabaseAuth } from "./mocks/supabase";
import { ProfilePage } from "./pages";

// Numeric columns arrive as strings from PostgREST.
const SPRINT_5M_ROW: MockSportTestRow = {
  id: "55555555-5555-4555-8555-555555555555",
  code: "SPRINT_5M",
  unit: "s",
  category: "SPEED",
  translations: {
    en: { name: "5 m sprint" },
    de: { name: "5-m-Sprint" },
  },
  sport_test_reference_values: [
    {
      gender: "FEMALE",
      position: "WING",
      training_stage: "GRUNDLAGENTRAINING",
      min_age: 13,
      max_age: 14,
      range_start: "9.87",
      range_end: "6.54",
    },
  ],
};

// A test stored for football only, e.g. for a handball athlete who sees every sport's tests.
const FOOTBALL_SPRINT_ROW: MockSportTestRow = {
  ...SPRINT_5M_ROW,
  id: "66666666-6666-4666-8666-666666666666",
  code: "SPRINT_30M",
  translations: { en: { name: "30 m sprint" }, de: { name: "30-m-Sprint" } },
};

test.describe("Performance tests: listing the tests", () => {
  test.use({ profile: createHandballWingProfile(14), signedIn: true });

  test("athlete sees the reference range for her training stage", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await mockSportTests(page, [SPRINT_5M_ROW]);
    const profilePage = new ProfilePage(page);
    await page.goto("/");
    await profilePage.expectLoggedIn();
    await profilePage.navigateToProfile();
    await page.getByText("Performance tests", { exact: true }).click();

    await expect(page.getByText("5 m sprint")).toBeVisible();
    await expect(page.getByText("Reference 9.87 to 6.54 s")).toBeVisible();
  });

  test("athlete records a value and sees it against the reference range", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await mockSportTests(page, [SPRINT_5M_ROW]);
    const profilePage = new ProfilePage(page);
    await page.goto("/");
    await profilePage.expectLoggedIn();
    await profilePage.navigateToProfile();
    await page.getByText("Performance tests", { exact: true }).click();
    await expect(
      page
        .getByTestId("performance-test-latest-SPRINT_5M")
        .getByText("No value"),
    ).toBeVisible();

    await page.getByTestId("performance-test-row-SPRINT_5M").click();
    await page.getByTestId("performance-test-value-input").fill("8,1");
    await page.getByTestId("performance-test-save").click();

    const summary = page.getByTestId("performance-test-summary");
    await expect(summary.getByText("8.1 s")).toBeVisible();
    await expect(summary.getByText("in range")).toBeVisible();
    await expect(page.getByTestId("performance-test-value-0")).toContainText(
      "8.1 s",
    );

    await page.goBack();

    const latest = page.getByTestId("performance-test-latest-SPRINT_5M");
    await expect(latest.getByText("8.1 s")).toBeVisible();
    await expect(latest.getByText("in range")).toBeVisible();
  });
});

const ENDURANCE_ROW: MockSportTestRow = {
  ...SPRINT_5M_ROW,
  id: "77777777-7777-4777-8777-777777777777",
  code: "COOPER_RUN",
  category: "ENDURANCE",
  translations: { en: { name: "Cooper run" }, de: { name: "Cooper-Lauf" } },
};

const UNKNOWN_CATEGORY_ROW: MockSportTestRow = {
  ...SPRINT_5M_ROW,
  id: "88888888-8888-4888-8888-888888888888",
  code: "FAKE_TEST",
  category: "FAKE_CATEGORY",
  translations: { en: { name: "Fake test" } },
};

test.describe("Performance tests: category filter", () => {
  test.use({ profile: createHandballWingProfile(14), signedIn: true });

  test("athlete filters the tests by category", async ({ page }) => {
    await mockSupabaseAuth(page);
    await mockSportTests(page, [
      SPRINT_5M_ROW,
      ENDURANCE_ROW,
      UNKNOWN_CATEGORY_ROW,
    ]);
    const profilePage = new ProfilePage(page);
    await page.goto("/");
    await profilePage.expectLoggedIn();
    await profilePage.navigateToProfile();
    await page.getByText("Performance tests", { exact: true }).click();
    const filter = page.getByLabel("Filter by category");

    // An unknown category shows its code and the stopwatch icon.
    const unknownRow = page.getByTestId("performance-test-row-FAKE_TEST");
    await expect(unknownRow.getByText("FAKE_CATEGORY")).toBeVisible();
    await expect(
      unknownRow.getByTestId("performance-test-icon-stopwatch"),
    ).toBeVisible();

    await filter.selectOption({ label: "Endurance" });
    await expect(page.getByText("Cooper run")).toBeVisible();
    await expect(page.getByText("5 m sprint")).toBeHidden();
    await expect(page.getByText("Fake test")).toBeHidden();

    await filter.selectOption({ label: "All categories" });
    await expect(page.getByText("5 m sprint")).toBeVisible();
    await expect(page.getByText("Fake test")).toBeVisible();
  });
});

test.describe("Performance tests: tests of every sport", () => {
  test.use({ profile: createHandballWingProfile(14), signedIn: true });

  test("handball athlete sees a football test stored for region DE", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    // The server answers like PostgREST: a sport filter keeps the football test out.
    await page.route("**/rest/v1/sport_tests**", (route) => {
      const filtersBySport = new URL(route.request().url()).searchParams.has(
        "sport",
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(filtersBySport ? [] : [FOOTBALL_SPRINT_ROW]),
      });
    });
    const profilePage = new ProfilePage(page);
    await page.goto("/");
    await profilePage.expectLoggedIn();
    await profilePage.navigateToProfile();
    await page.getByText("Performance tests", { exact: true }).click();

    await expect(page.getByText("30 m sprint")).toBeVisible();
  });
});

test.describe("Performance tests: German athlete", () => {
  test.use({
    profile: createHandballWingProfile(14),
    signedIn: true,
    locale: "de-DE",
  });

  test("athlete sees the test name in German in the list", async ({ page }) => {
    await mockSupabaseAuth(page);
    await mockSportTests(page, [SPRINT_5M_ROW]);
    // The page objects read English labels, so this test opens the screen by URL.
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Hallo .+/ })).toBeVisible();
    await page.goto("/performance-tests");

    await expect(
      page.getByRole("heading", { name: "Leistungstests" }),
    ).toBeVisible();
    await expect(page.getByText("5-m-Sprint")).toBeVisible();
    await expect(page.getByText("5 m sprint")).toBeHidden();
  });
});
