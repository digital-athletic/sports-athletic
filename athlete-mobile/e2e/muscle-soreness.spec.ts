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

function greyMusclePaths(page: Page): Locator {
  return page.locator('svg path[fill="#e8e8e8"]');
}

function redMusclePaths(page: Page): Locator {
  return page.locator('svg path[fill="#c71b1b"]');
}

function rotateButton(page: Page): Locator {
  return page.getByRole("button", { name: "Rotate body view" });
}

async function navigateAndWaitForSvg(page: Page) {
  await mockSupabaseAuth(page);
  await navigateToMuscleSoreness(page);
  await expect(greyMusclePaths(page).first()).toBeVisible({ timeout: 5000 });
}

test.describe("Muscle Soreness – Male SVG", () => {
  test.use({ profile: createCompletedProfile() });

  test("renders grey muscle regions on the front view", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForSvg(page);

    expect(await greyMusclePaths(page).count()).toBeGreaterThan(0);
  });

  test("has no selected muscles initially", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForSvg(page);

    expect(await redMusclePaths(page).count()).toBe(0);
  });

  test("shows the rotate button", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForSvg(page);

    await expect(rotateButton(page)).toBeVisible();
  });

  test("selecting a muscle turns paths red", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForSvg(page);

    await greyMusclePaths(page).first().click();

    await expect(redMusclePaths(page).first()).toBeVisible({ timeout: 3000 });
  });

  test("selecting a muscle decreases grey path count", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForSvg(page);
    const greyBefore = await greyMusclePaths(page).count();

    await greyMusclePaths(page).first().click();
    await expect(redMusclePaths(page).first()).toBeVisible({ timeout: 3000 });

    expect(await greyMusclePaths(page).count()).toBeLessThan(greyBefore);
  });

  test("deselecting a muscle removes the red highlight", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForSvg(page);

    await greyMusclePaths(page).first().click();
    await expect(redMusclePaths(page).first()).toBeVisible({ timeout: 3000 });
    const redCount = await redMusclePaths(page).count();

    await redMusclePaths(page).first().click();

    expect(await redMusclePaths(page).count()).toBeLessThan(redCount);
  });

  test("rotating to back renders grey muscle regions", async ({ page }) => {
    test.setTimeout(60000);
    await navigateAndWaitForSvg(page);

    await rotateButton(page).click();

    await expect(greyMusclePaths(page).first()).toBeVisible({ timeout: 5000 });
  });

  test("selection persists after rotating front → back → front", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await navigateAndWaitForSvg(page);

    await greyMusclePaths(page).first().click();
    await expect(redMusclePaths(page).first()).toBeVisible({ timeout: 3000 });
    const selectedRedCount = await redMusclePaths(page).count();

    await rotateButton(page).click();
    await expect(greyMusclePaths(page).first()).toBeVisible({ timeout: 5000 });
    await rotateButton(page).click();
    await expect(greyMusclePaths(page).first()).toBeVisible({ timeout: 5000 });

    expect(await redMusclePaths(page).count()).toBe(selectedRedCount);
  });
});

test.describe("Muscle Soreness – Female PNG", () => {
  test.use({ profile: createFemaleCompletedProfile() });

  test("renders coaching prompt", async ({ page }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await navigateToMuscleSoreness(page);

    await expect(page.getByText("Where are the aching muscles?")).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows the rotate button", async ({ page }) => {
    test.setTimeout(60000);
    await mockSupabaseAuth(page);
    await navigateToMuscleSoreness(page);

    await expect(rotateButton(page)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Pain Regions – Male SVG", () => {
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

test.describe("Pain Regions – Female PNG", () => {
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
