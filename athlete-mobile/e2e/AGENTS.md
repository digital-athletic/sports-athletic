# Playwright E2E Tests

## Setup
- Playwright browsers are installed in a different container, see ../playwright.config.ts => Do NOT install locally browsers
- To run the tests, please use pnpm run test:e2e from the root of the athlete-mobile app directory

## Understanding Flows
- Use chrome-devtools MCP to click through flows (ask user for real login creds)
- Or analyze code: screens, Zustand stores, JSON files in `/assets`

## Writing Tests
- Build screen by screen; comment remaining steps while developing
- Use `mockSupabaseAuth()` for auth — never real credentials in tests
- Avoid hardcoded timeouts; use the Auto-waiting feature with optional timeouts, e.g. `.click({ timeout: 3000 })`

## Seeding Stores

**Use factory functions with `test.use({ profile })`:**

```typescript
import { test, expect } from "./fixtures";
import { createWorkoutsProfile } from "./mocks/stores/profiles/workoutsProfile";

test.describe("Statistics", () => {
  test.use({ profile: createWorkoutsProfile(2) });

  test("shows workout totals", async ({ page }) => {
    await mockSupabaseAuth(page);
    // Profile data is seeded via storageState
  });
});
```

**Important:** Import `test` and `expect` from `./fixtures` instead of `@playwright/test`.

State changes during the test (completing workouts, saving progress) persist correctly because:
- SPA navigation is client-side (no full page reload)
- localStorage persists within the browser context
- The app reads state once on initial load

### Available Profile Factories

| Factory | Description |
|---------|-------------|
| `createCompletedProfile()` | User with completed anamnesis and strength test |
| `createCompletedProfileWithoutTestHistory()` | Completed profile without test history |
| `createBranchThresholdProfile()` | User at max threshold, ready for branch level up |
| `createFreshAnamnesisProfile()` | Completed anamnesis but no strength test |
| `createIncompleteAnamnesisProfile()` | Authenticated but anamnesis not completed |
| `createWorkoutsProfile(count)` | Pre-completed workouts for statistics tests |
| `createZeroXpWorkoutsProfile(count)` | Workouts with 0 XP (edge case testing) |
| `createTimeFilteredWorkoutsProfile()` | Workouts at different time intervals |

### Mid-test State Changes

For tests that need to change localStorage during execution (rare), use `page.evaluate()`:

```typescript
await page.evaluate((stores) => {
  for (const [key, value] of Object.entries(stores)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}, profileData);
```

## Debugging
- Don't delete failing steps — comment them out
- Take screenshots at each step to identify issues
- Break problems down systematically

## Key Files
- `fixtures.ts` — Custom test fixture with `profile` option
- `mocks/stores/profiles/*` — Profile factories
- `mocks/supabase.ts` — `mockSupabaseAuth()`
