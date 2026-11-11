import { type Locator, type Page, expect } from "@playwright/test";

/** The Workouts tab of the dashboard: the list of team workouts. */
export class WorkoutsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.getByTestId("tab-workouts").click();
  }

  async expectNoWorkouts() {
    await expect(this.page.getByTestId("workouts-empty")).toBeVisible();
  }

  /** Workout names come from the fixture or the test, not a translation. */
  workout(name: string): Locator {
    return this.page.getByTestId("workout-item").filter({
      has: this.page.getByRole("heading", { name, exact: true }),
    });
  }

  async expectWorkout(name: string) {
    await expect(this.workout(name)).toBeVisible();
  }

  /** Tags are matched by code, so the check is independent of the translation. */
  async expectSectionTags(name: string, index: number, tags: string[]) {
    await expect(
      this.workout(name).getByTestId("workout-section").nth(index),
    ).toHaveAttribute("data-tags", tags.join(" "));
  }

  async expectNoEditActions() {
    await expect(this.page.getByTestId("workout-new")).toHaveCount(0);
    await expect(this.page.getByTestId("workout-edit")).toHaveCount(0);
    await expect(this.page.getByTestId("workout-delete")).toHaveCount(0);
  }

  async deleteWorkout(name: string) {
    await this.workout(name).getByTestId("workout-delete").click();
    await this.page.getByTestId("workout-delete-confirm").click();
  }
}
