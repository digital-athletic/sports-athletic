# Playwright E2E Tests

## Setup
- Playwright browsers are installed in a different container, see ../playwright.config.ts => Do NOT install locally browsers
- To run the tests, please use pnpm run test:e2e from the root of the athlete-mobile app directory

## Run Only What You Need (IMPORTANT)
- E2E runs are slow (serial, remote browser, Metro bundling). NEVER run the whole suite while iterating.
- Scope every run as narrowly as possible: `pnpm test:e2e <file>` for one file, plus `-g "<test name substring>"` for a single test (e.g. `pnpm test:e2e muscle-soreness -g "renders coaching prompt"`).
- To (re)generate a screenshot, run exactly the one test that captures it, nothing else.
- Run the full suite at most once, as the very last verification step — and only when cross-cutting changes justify it.
- Iterating on tests? Start the web server once yourself with the env block from `playwright.config.ts` `webServer` (see there) and keep it running; `reuseExistingServer` skips the per-run `--clear` re-bundle.
- `E2E_STATIC=1 pnpm test:e2e` runs against a production export (`pnpm run e2e:static`) instead of the Metro dev server, as CI does. Pages boot about twice as fast; use it for full runs. Stop a running Metro server on 8081 first, otherwise `reuseExistingServer` keeps using it.
- Beware: `pnpm test:e2e -- <filter>` does NOT work (the `--` swallows the filter and everything runs); pass the filter without `--`.

## Understanding Flows
- Use chrome-devtools MCP to click through flows (ask user for real login creds)
- Or analyze code: screens, Zustand stores, JSON files in `/assets`

## Writing Tests
- One test is one named user scenario that reads top to bottom. Checks that share setup and belong to the same scenario go into one test; unrelated checks stay in their own test.
- Never add a test that repeats the setup and assertions of an existing one.
- Build screen by screen; comment remaining steps while developing
- Use `mockSupabaseAuth()` for auth — never real credentials in tests
- Avoid hardcoded timeouts; use the Auto-waiting feature with optional timeouts, e.g. `.click({ timeout: 3000 })`

## Seeding Stores

**Use factory functions with `test.use({ profile })`:**

```typescript
import { test, expect } from "./fixtures";
import { createWorkoutsProfile } from "./mocks/stores/profiles/workoutsProfile";

test.describe("Statistics", () => {
  test.use({ profile: createWorkoutsProfile(2), signedIn: true });

  test("shows workout totals", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/");
    // Profile data and the signed in session are seeded via storageState
  });
});
```

**Important:** Import `test` and `expect` from `./fixtures` instead of `@playwright/test`.

**Signed in session:** `signedIn: true` seeds the session (`mocks/auth.ts`), so the app opens signed in without the OTP login. Drive `BasePage.login` only in tests whose subject is login, registration or consent at login.

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
| `createRadarChartFilteringProfile()` | Workouts at different time intervals with skill data |

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
- `fixtures.ts` — Custom test fixture with `profile` and `signedIn` options
- `mocks/auth.ts` — Seeded signed in session
- `mocks/stores/profiles/*` — Profile factories
- `mocks/supabase.ts` — `mockSupabaseAuth()`
