import { expect, test } from "./fixtures";
import { createCompletedProfile } from "./mocks/stores/profiles/completedProfile";
import { createIncompleteAnamnesisProfile } from "./mocks/stores/profiles/incompleteAnamnesisProfile";
import { mockSupabaseAuth } from "./mocks/supabase";
import { AnamnesisPage, BasePage } from "./pages";
import { STORAGE_KEYS } from "./mocks/stores/constants";
import { createUserProfileStore } from "./mocks/stores/data/userProfileStore";
import { type Locator, type Page } from "@playwright/test";

function createFemaleCompletedProfile() {
  const profile = createCompletedProfile();
  return {
    ...profile,
    [STORAGE_KEYS.USER_PROFILE]: createUserProfileStore({
      gender: "FEMALE",
      anamnesisCompleted: true,
      isInInitialAnamnesis: false,
    }),
  };
}

function createMaleIncompleteProfile() {
  return {
    ...createIncompleteAnamnesisProfile(),
    [STORAGE_KEYS.USER_PROFILE]: createUserProfileStore({
      gender: "MALE",
      anamnesisCompleted: false,
      isInInitialAnamnesis: true,
    }),
  };
}

function createFemaleIncompleteProfile() {
  return {
    ...createIncompleteAnamnesisProfile(),
    [STORAGE_KEYS.USER_PROFILE]: createUserProfileStore({
      gender: "FEMALE",
      anamnesisCompleted: false,
      isInInitialAnamnesis: true,
    }),
  };
}

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

// Chip background colours from the theme: lightGrey2 when unselected, primary
// (red) when selected.
const UNSELECTED = "rgb(232, 232, 232)";
const SELECTED = "rgb(199, 27, 27)";

function muscleChip(page: Page, name: string): Locator {
  return page.getByRole("button", { name, exact: true });
}

async function navigateAndWaitForOptions(page: Page) {
  await mockSupabaseAuth(page);
  await navigateToMuscleSoreness(page);
  await expect(muscleChip(page, "neck")).toBeVisible({ timeout: 5000 });
}

// Shared label selection behaviour, identical for male and female bodies since
// both render the same option chips through BodyPartsSelector.
function registerLabelSelectionTests() {
  test("renders selectable muscle labels", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForOptions(page);

    await expect(muscleChip(page, "neck")).toBeVisible();
    await expect(muscleChip(page, "breast")).toBeVisible();
  });

  test("shows muscle labels unselected initially", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForOptions(page);

    await expect(muscleChip(page, "neck")).toHaveCSS(
      "background-color",
      UNSELECTED,
    );
  });

  test("selecting a muscle highlights its label", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForOptions(page);

    await muscleChip(page, "neck").click();

    await expect(muscleChip(page, "neck")).toHaveCSS(
      "background-color",
      SELECTED,
      { timeout: 3000 },
    );
  });

  test("deselecting a muscle removes the highlight", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForOptions(page);

    await muscleChip(page, "neck").click();
    await expect(muscleChip(page, "neck")).toHaveCSS(
      "background-color",
      SELECTED,
      { timeout: 3000 },
    );

    await muscleChip(page, "neck").click();
    await expect(muscleChip(page, "neck")).toHaveCSS(
      "background-color",
      UNSELECTED,
      { timeout: 3000 },
    );
  });

  test("selecting multiple muscles highlights each", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForOptions(page);

    await muscleChip(page, "neck").click();
    await muscleChip(page, "breast").click();

    await expect(muscleChip(page, "neck")).toHaveCSS(
      "background-color",
      SELECTED,
      { timeout: 3000 },
    );
    await expect(muscleChip(page, "breast")).toHaveCSS(
      "background-color",
      SELECTED,
      { timeout: 3000 },
    );
  });
}

test.describe("Muscle Soreness: Male", () => {
  test.use({ profile: createCompletedProfile() });

  registerLabelSelectionTests();
});

test.describe("Muscle Soreness: Female", () => {
  test.use({ profile: createFemaleCompletedProfile() });

  registerLabelSelectionTests();

  test("renders coaching prompt", async ({ page }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await navigateToMuscleSoreness(page);

    await expect(page.getByText("Where are the aching muscles?")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Pain Regions: Male", () => {
  test.use({ profile: createMaleIncompleteProfile() });

  test("renders coaching prompt on pain screen", async ({ page }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await navigateToPainScreen(page);

    await expect(
      page.getByText("Please select the areas that are hurting you"),
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Pain Regions: Female", () => {
  test.use({ profile: createFemaleIncompleteProfile() });

  test("renders coaching prompt on pain screen", async ({ page }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await navigateToPainScreen(page);

    await expect(
      page.getByText("Please select the areas that are hurting you"),
    ).toBeVisible({ timeout: 5000 });
  });
});
