import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ProfilePage extends BasePage {
  private get profileHeading() {
    return this.page.getByRole("heading", { name: "Profile" });
  }

  private get seasonPhaseHeading() {
    return this.page
      .getByRole("heading", { name: "Season phase", exact: true })
      .first();
  }

  private get trainingDaysHeading() {
    return this.page.getByRole("heading", { name: "Training Days" });
  }

  private get myTrainingDataButton() {
    return this.page.getByText("My Training Data");
  }

  private get deleteUserButton() {
    // Use first() to handle cases where screens are stacked (a known bug)
    return this.page.getByRole("button", { name: "Delete account" }).first();
  }

  async navigateToProfile() {
    await this.navigateToTab("Profile");
    await expect(this.profileHeading).toBeVisible();
  }

  async openMyTrainingData() {
    await this.myTrainingDataButton.scrollIntoViewIfNeeded();
    await this.myTrainingDataButton.click();
    await expect(this.seasonPhaseHeading).toBeVisible({ timeout: 10000 });
  }

  async changeSeasonPhase(from: string, to: string) {
    await this.page.getByText(from).click();
    await this.page.getByText(to).click();
    await this.page.getByText("OK").last().click();
  }

  async proceedToTrainingDays() {
    await this.goOnButton.click();
    await expect(this.trainingDaysHeading).toBeVisible({ timeout: 10000 });
  }

  /**
   * After changing training data, save the changes by clicking "Go On" on Training Days.
   * This triggers a new training plan generation and waits for completion.
   */
  async saveTrainingDataChanges() {
    // Click Go On to trigger plan regeneration
    await this.goOnButton.click();

    // Wait for generating screen to appear
    const generatingText = this.page.getByText(/generating.*training.*plan/i);
    await expect(generatingText).toBeVisible({ timeout: 10000 });

    // Wait for generating to complete - the screen should disappear and redirect to home
    // First wait for the generating screen to finish
    await expect(generatingText).not.toBeVisible({ timeout: 90000 });

    // Then wait for the home screen
    await expect(
      this.page.getByRole("heading", { name: /Hello/i }),
    ).toBeVisible({
      timeout: 15000,
    });
  }

  async goBackToProfile() {
    await this.page.goBack();
    await this.page.goBack();
    const profileTab = this.page.getByRole("tab", { name: /Profile/i });
    if (await profileTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileTab.click();
    }
    await expect(this.profileHeading).toBeVisible({ timeout: 10000 });
  }

  async deleteAccount() {
    // Ensure we're on the Profile tab by clicking it
    const profileTab = this.page.getByRole("tab", { name: /Profile/i });
    await profileTab.click();
    await expect(this.profileHeading).toBeVisible({ timeout: 5000 });

    // Find the Delete account button by its icon (more specific selector)
    // and click it directly using evaluate to bypass visibility issues from stacked screens
    const clicked = await this.page.evaluate(() => {
      // Find all elements containing "Delete account" text
      const elements = Array.from(document.querySelectorAll("*")).filter(
        (el) =>
          el.textContent?.trim() === "Delete account" &&
          el.children.length === 0,
      );

      for (const el of elements) {
        // Find the clickable parent (usually the row container)
        let clickable =
          el.closest('[cursor="pointer"]') || el.parentElement?.parentElement;
        if (clickable) {
          // Scroll element into view
          clickable.scrollIntoView({ behavior: "instant", block: "center" });
          // Click it
          (clickable as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (!clicked) {
      // Fallback: try the standard approach with force click
      await this.deleteUserButton.click({ force: true });
    }

    await expect(this.page.getByText("Delete account?")).toBeVisible({
      timeout: 10000,
    });
    await this.page.getByText("YES").first().click();
    await expect(this.page.getByText("Delete account?")).not.toBeVisible();
  }

  async expectLoginPage() {
    await expect(
      this.page.getByRole("button", { name: "Send code" }),
    ).toBeVisible({
      timeout: 10000,
    });
  }
}
