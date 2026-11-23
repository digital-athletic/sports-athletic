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

  /** The card of a team the user is a plain member of. */
  private memberTeam(name: string) {
    return this.page.getByTestId("member-team-card").filter({ hasText: name });
  }

  async expectMemberTeam(name: string) {
    await expect(this.memberTeam(name)).toBeVisible();
  }

  /** For a team that must not open: clicks the name without expecting a move. */
  async clickTeamName(name: string) {
    await this.page.getByRole("heading", { name, level: 2 }).click();
  }

  async leaveTeam(name: string) {
    await this.memberTeam(name).getByTestId("member-team-leave").click();
    await this.page.getByTestId("member-team-leave-confirm").click();
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

  /**
   * A rejected write keeps the user here and reports it. The raw ErrorCode must
   * never reach the screen; only the translated message does.
   */
  async expectErrorWithoutCode(code: string) {
    const alert = this.page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText(code);
    await expect(this.page).toHaveURL(/\/teams/);
  }

  /** Creating a group is only offered to a granted trainer. */
  async expectCreateUnavailable() {
    await expect(this.page.getByTestId("team-selection-create")).toHaveCount(0);
  }
}
