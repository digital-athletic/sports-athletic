import { type Page, expect } from "@playwright/test";

export class TeamSelectionPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/teams/);
    await expect(this.page.getByTestId("team-selection-title")).toBeVisible();
  }

  async expectTeam(name: string) {
    await expect(
      this.page.getByRole("heading", { name, level: 2 }),
    ).toBeVisible();
  }

  async expectNoTeams() {
    await expect(this.page.getByTestId("team-selection-empty")).toBeVisible();
  }
}
