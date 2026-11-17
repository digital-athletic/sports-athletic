import { type Page } from "@playwright/test";

/** A sport_tests row as PostgREST returns it with the embedded reference values. */
export type MockSportTestRow = {
  id: string;
  code: string;
  unit: string;
  /** Category code such as SPEED, stored in upper case, or null for a test without a category. */
  category: string | null;
  /** Name and unit per language code, or null for a test without translations. */
  translations: Record<string, { name: string; unit?: string }> | null;
  sport_test_reference_values: {
    gender: "MALE" | "FEMALE";
    position: string;
    training_stage: string;
    min_age: number;
    max_age: number;
    range_start: string;
    range_end: string;
  }[];
};

/**
 * Serves the given sport tests for every sport_tests request.
 * Call after mockSupabaseAuth so Playwright's LIFO routing prefers this.
 */
export async function mockSportTests(
  page: Page,
  rows: MockSportTestRow[],
): Promise<void> {
  await page.route("**/rest/v1/sport_tests**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(rows),
    }),
  );
}
