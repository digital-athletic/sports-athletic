import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createIncompleteAnamnesisProfile } from "./mocks/stores/profiles/incompleteAnamnesisProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { AnamnesisPage, BasePage } from "./pages";
import { type Locator, type Page } from "@playwright/test";

// The trip through login and training setup outgrows the 30s config default.
test.describe.configure({ timeout: 60_000 });

async function navigateToMuscleSoreness(page: Page) {
  const basePage = new BasePage(page);
  await basePage.login("test@example.com");
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
  await anamnesisPage.login("test@example.com");

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
test.describe("Muscle Soreness", () => {
  test.use({ profile: createCompletedProfile() });

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
test.describe("Pain Regions", () => {
  test.use({ profile: createIncompleteAnamnesisProfile() });

  test("renders coaching prompt on pain screen", async ({ page }) => {
    await mockSupabaseAuth(page);
    await navigateToPainScreen(page);

    await expect(
      page.getByText("Please select the areas that are hurting you"),
    ).toBeVisible({ timeout: 5000 });
  });
});
