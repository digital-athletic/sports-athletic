# Playwright E2E Tests

## Setup

- The browsers live in the `playwright` container from `docker-compose.yml`. Do NOT install browsers locally.
- The `docker compose` commands below run on the host. The repository AGENTS.md notes that Docker is unavailable inside the dev container; from in there, only the `pnpm test:e2e` part applies, with the containers already started from outside.
- Run the tests from inside the `trainer-web` container, not from the host:

```bash
supabase start                                   # compose needs its network
docker compose up -d trainer-web playwright
docker compose exec trainer-web sh -c 'cd /workspace/trainer-web && pnpm test:e2e'
```

Compose supplies `TESTING_PLAYWRIGHT_WS_ENDPOINT` and `TESTING_PLAYWRIGHT_BASE_URL`, so both sides talk over the compose network under their service names. Running from the host does not work: the Playwright port is reachable from the compose network only.

On CI there is no container. `process.env.CI` switches the config to browsers installed in the runner and collapses both URLs to `localhost`.

**Upgrading Playwright means three declarations.** The image tag in `docker-compose.yml` supplies the browsers, the start command right below it pins the server package, and `@playwright/test` in `package.json` is the client. Move all three together: a server newer than its client is refused outright, and a server newer than the image runs against browsers it was not built for.

## No backend

Supabase is never contacted. `mocks/supabase.ts` intercepts the calls at the HTTP layer with `page.route()`, which keeps everything below it real: the Supabase client, the hooks and the components all run as they do in production, only the network is answered from a fixture.

That layer is the seam. Pointing the suite at a real Supabase later means not calling `mockSupabase()`, rather than rewriting tests.

**Know what this cannot prove.** Authorisation in this app lives in row level security policies in Postgres. A mocked test can show that the UI handles a rejection, never that the rejection would actually happen. Tests about who may see or do what need a real instance.

## Writing tests

```typescript
import { test } from "@playwright/test";
import { mockSupabase, MOCK_USER } from "./mocks/supabase";
import { LoginPage } from "./pages/LoginPage";

test("...", async ({ page }) => {
  await mockSupabase(page, { trainerGrantedAt: new Date().toISOString() });
  await new LoginPage(page).signIn(MOCK_USER.email);
});
```

- `mockSupabase(page, options)` takes the user, the trainer and admin grants and a list of teams. Sign in through `LoginPage` rather than seeding a session: supabase-js writes the session to localStorage itself once the mocked verify call returns.
- Put selectors and flows in `pages/`, never in the spec.
- Select by `data-testid`. The app is hardcoded to German (`lng: "de"` in `src/i18n/index.ts`), so asserting on visible text ties a test to a translation. Add the attribute to the component when it is missing; `FormInput` and `Button` forward unknown props, so no change to the shared components is needed.
- Avoid fixed timeouts; rely on auto-waiting, with a timeout on the individual call when needed.

## Key files

- `playwright.config.ts` — two URLs, one for the runner and one for the browser; see the comment at the top
- `mocks/supabase.ts` — `mockSupabase()`
- `pages/*` — page objects
