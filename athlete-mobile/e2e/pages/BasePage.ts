import { expect, type Page } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  protected get goOnButton() {
    return this.page.getByRole("button", { name: "Go on" });
  }

  async login(email: string, password: string) {
    await this.page.goto("/");
    await expect(
      this.page.getByRole("button", { name: "Login" }),
    ).toBeVisible();
    await this.page.getByPlaceholder("E-Mail").fill(email);
    await this.page.getByPlaceholder("Password").fill(password);
    await this.page.getByRole("button", { name: "Login" }).click();
  }

  async expectLoggedIn() {
    await expect(
      this.page.getByRole("heading", { name: /Hello .+/i }),
    ).toBeVisible();
  }

  async expectTrainingPlanVisible() {
    await expect(this.page.getByText("Your Training Plan")).toBeVisible();
  }

  async skipMuscleSoreness() {
    await expect(
      this.page.getByRole("heading", { name: "Muscle soreness" }),
    ).toBeVisible();
    await this.goOnButton.click();
  }

  async navigateToTab(tabName: string) {
    // Target the bottom navigation tablist to avoid matching tabs in page content
    // The bottom navigation has tabs within a tablist element
    await this.page
      .getByRole("tablist")
      .getByRole("tab", { name: new RegExp(tabName, "i") })
      .click();
  }
}
