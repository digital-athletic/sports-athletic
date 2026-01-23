# Playwright E2E Tests

## Setup
- Playwright browsers are installed in a different container, see ../playwright.config.ts => Do NOT install locally browsers
- To run the tests, please use pnpm run test:e2e from the root of the athlete-mobile app directory

## Understanding Flows
- Use chrome-devtools MCP to click through flows (ask user for real login creds)
- Or analyze code: screens, Zustand stores, JSON files in `/assets`

## Writing Tests
- Build screen by screen; comment remaining steps while developing
- Use mocks from `./mocks/stores.ts` for seeding Zustand state
- Use `mockSupabaseAuth()` for auth — never real credentials in tests
- Avoid hardcoded timeouts; use the Auto-waiting feature with optional timeouts, e.g. `.click({ timeout: 3000 })`

## Debugging
- Don't delete failing steps — comment them out
- Take screenshots at each step to identify issues
- Break problems down systematically

## Key Files
- `mocks/stores.ts` — `seedCompletedProfile()`, `seedStores()`, `clearStores()`
- `mocks/supabase.ts` — `mockSupabaseAuth()`
