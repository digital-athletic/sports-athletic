import { type Page, expect } from "@playwright/test";

export class DashboardPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectVisible(teamId?: string) {
    await expect(this.page).toHaveURL(
      teamId ? new RegExp(`/dashboard\\?team=${teamId}`) : /\/dashboard/,
    );
  }

  /** Names come from the fixture, not from a translation. */
  async expectTeamName(name: string) {
    await expect(
      this.page.getByRole("heading", { name, level: 3 }),
    ).toBeVisible();
  }

  async expectMember(name: string) {
    await expect(this.page.getByText(name, { exact: false })).toBeVisible();
  }

  async openEvaluations() {
    await this.page.getByTestId("tab-evaluations").click();
  }

  /**
   * The athlete list is a <details>, so clicking it toggles. Opening it blindly
   * would close it again whenever it is already open.
   */
  private async openAthleteList() {
    const selector = this.page.getByTestId("athlete-selector");
    // <details> reflects its state into the attribute, which keeps this out of
    // the browser context and needs no DOM lib in tsconfig.e2e.json.
    if ((await selector.getAttribute("open")) === null) await selector.click();
  }

  async selectAthlete(name: string) {
    await this.openAthleteList();
    await this.page
      .getByTestId("athlete-option")
      .filter({ hasText: name })
      .click();
  }

  async expectAthletes(names: string[]) {
    await this.openAthleteList();
    const options = this.page.getByTestId("athlete-option");
    await expect(options).toHaveCount(names.length);
    for (const name of names) {
      await expect(options.filter({ hasText: name })).toHaveCount(1);
    }
  }

  async expectTrainingCount(count: number) {
    await expect(this.page.getByTestId("summary-training-count")).toHaveText(
      String(count),
    );
  }

  async expectNoAthletes() {
    await expect(this.page.getByTestId("evaluations-empty")).toBeVisible();
  }
}
