import { expect, test } from "./fixtures";
import { STORAGE_KEYS } from "./mocks/stores/constants";
import { createUserWorkoutStore } from "./mocks/stores/data/userWorkoutStore";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createIncompleteAnamnesisProfile } from "./mocks/stores/profiles/incompleteAnamnesisProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { AnamnesisPage, BasePage } from "./pages";
import { type Locator, type Page } from "@playwright/test";

async function navigateToMuscleSoreness(page: Page) {
  const basePage = new BasePage(page);
  await page.goto("/");
  await basePage.expectLoggedIn();

  await page
    .getByRole("button", { name: "Start Training" })
    .click({ timeout: 15000 });
  await expect(
    page.getByRole("heading", { name: /Start.*training/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Tuesday/i }).click();

  await expect(
    page.getByRole("heading", { name: "Muscle soreness" }),
  ).toBeVisible({ timeout: 10000 });
}

async function navigateToPainScreen(page: Page) {
  const anamnesisPage = new AnamnesisPage(page);
  await page.goto("/");

  await expect(page.getByText(/I am Ingemar/)).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: /let's go/i }).click();

  await anamnesisPage.selectSport("Handball");

  await expect(
    page.getByRole("heading", { name: "Personal Data" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Go on" }).click();

  await expect(
    page.getByRole("heading", { name: "Height & Weight" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Go on" }).click();

  await expect(
    page.getByRole("heading", { name: "Position & Fitness" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Go on" }).click();

  await expect(page.getByRole("heading", { name: "Pains" })).toBeVisible({
    timeout: 10000,
  });
}

function silhouette(page: Page): Locator {
  return page.getByTestId("muscle-silhouette");
}

// Regions are exposed as ARIA checkboxes (toggle semantics; role="button"
// would make react-native-web render a real <button>, invalid inside <svg>).
// Queries are scoped to the silhouette because central region names (e.g.
// "neck") also appear as removable chips in the selected-muscles list.
function region(page: Page, name: string): Locator {
  return silhouette(page).getByRole("checkbox", { name, exact: true });
}

// A coordinate click (locator.click) aims at the bounding-box center, which
// misses these concave, overlapping muscle paths. Dispatching the click event
// directly trades real hit-testing for stability.
function clickRegion(page: Page, name: string) {
  return region(page, name).dispatchEvent("click");
}

function selectedChips(page: Page): Locator {
  return page.getByTestId("selected-muscles");
}

// Component behaviour (toggling, lateralization, gender artwork, chips) is
// covered by the unit specs in src/bodyParts; e2e checks one happy path.
test.describe("Muscle Soreness: selection", () => {
  test.use({ profile: createCompletedProfile(), signedIn: true });

  test("selects a muscle on each side and proceeds to the training", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    await navigateToMuscleSoreness(page);
    await expect(region(page, "neck")).toBeVisible({ timeout: 5000 });

    // Both picks stay in one body area (lower body): soreness across several
    // areas makes the generator refuse the workout by design.
    await clickRegion(page, "left front thigh");
    await expect(region(page, "left front thigh")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.getByRole("button", { name: "Show back side" }).click();
    await clickRegion(page, "left back thigh");

    const chips = selectedChips(page);
    await expect(
      chips.getByRole("button", { name: "left front thigh", exact: true }),
    ).toBeVisible();
    await expect(
      chips.getByRole("button", { name: "left back thigh", exact: true }),
    ).toBeVisible();

    // Planned (Tuesday) workouts skip place selection and generate directly.
    await page.getByRole("button", { name: "Go on" }).click();
    await expect(
      page.getByRole("heading", { name: "Training Overview" }),
    ).toBeVisible({ timeout: 15000 });
  });
});

// The pain screen renders gender-independent chips, so one profile suffices.
test.describe("Pain Regions: anamnesis pain screen", () => {
  test.use({ profile: createIncompleteAnamnesisProfile(), signedIn: true });

  test("renders coaching prompt on pain screen", async ({ page }) => {
    await mockSupabaseAuth(page);
    await navigateToPainScreen(page);

    await expect(page.getByText("Select the areas that hurt")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Pain Warning: strength test start", () => {
  test.use({
    profile: {
      ...createCompletedProfile(),
      [STORAGE_KEYS.USER_WORKOUT]: createUserWorkoutStore({
        tags: { POSITION: ["FIELD"], LEVEL: ["BEGINNER"], PAIN: ["KNEE_LEFT"] },
      }),
    },
    signedIn: true,
  });

  test("warns about declared pains before a strength test starts", async ({
    page,
  }) => {
    await mockSupabaseAuth(page);
    const basePage = new BasePage(page);
    await page.goto("/");
    await basePage.expectLoggedIn();

    await basePage.navigateToTab("Profile");
    await page.getByText("Start Strength Test").click();
    await basePage.skipMuscleSoreness();

    await expect(page.getByText("Attention for pain")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("heading", { name: "Training Overview" }),
    ).not.toBeVisible();

    await page.getByText("OK", { exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Training Overview" }),
    ).toBeVisible({ timeout: 15000 });
  });
});
