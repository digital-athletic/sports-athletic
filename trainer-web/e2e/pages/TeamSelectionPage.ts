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

  /** Team names come from the fixture, not from a translation. */
  async expectTeam(name: string) {
    await expect(
      this.page.getByRole("heading", { name, level: 2 }),
    ).toBeVisible();
  }

  async expectNoTeams() {
    await expect(this.page.getByTestId("team-selection-empty")).toBeVisible();
  }

  async openTeam(name: string) {
    await this.page.getByRole("heading", { name, level: 2 }).click();
  }

  async createTeam(name: string) {
    await this.page.getByTestId("team-selection-create").click();
    await this.page.getByTestId("create-team-name").fill(name);
    await this.page.getByTestId("create-team-submit").click();
  }

  async joinTeam(code: string) {
    await this.page.getByTestId("team-selection-join").click();
    await this.page.getByTestId("join-team-code").fill(code);
    await this.page.getByTestId("join-team-submit").click();
  }

  /** Creating a group is only offered to a granted trainer. */
  async expectCreateUnavailable() {
    await expect(this.page.getByTestId("team-selection-create")).toHaveCount(0);
  }
}
