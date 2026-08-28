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

**Upgrading Playwright means four declarations.** The image tag in `docker-compose.yml` supplies the browsers, the start command right below it pins the server package, and `@playwright/test` is the client in both `trainer-web/package.json` and `athlete-mobile/package.json`. The server is shared, so both apps move together: a server newer than its client is refused outright, and a server newer than the image runs against browsers it was not built for.

## No backend

Supabase is never contacted. `mocks/supabase.ts` intercepts the calls at the HTTP layer with `page.route()`, which keeps everything below it real: the Supabase client, the hooks and the components all run as they do in production, only the network is answered from a fixture.

That layer is the seam. Pointing the suite at a real Supabase later means not calling `mockSupabase()`, rather than rewriting tests.

**Know what this cannot prove.** Authorisation in this app lives in row level security policies in Postgres. A mocked test can show that the UI handles a rejection, never that the rejection would actually happen. Tests about who may see or do what need a real instance.

**Do not give the mock a memory.** It answers from the fixture and stores nothing. A test that writes describes the world before and the world after instead, since a later `mockSupabase()` call wins:

```typescript
const trainer = { trainerGrantedAt: new Date().toISOString() };

await mockSupabase(page, { ...trainer, teams: [] }); // before
await teamSelection.expectNoTeams();
await mockSupabase(page, { ...trainer, teams: [created] }); // after the write
await teamSelection.createTeam(created.name);
```

A catch-all on `**/rest/v1/**` answers anything no fixture covers with an empty array, registered first so specific routes win. Without it an unmocked call leaves the page and the test hangs instead of failing where it can be read.

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
- Select translated chrome by `data-testid`. The app is hardcoded to German (`lng: "de"` in `src/i18n/index.ts`), so asserting on such text ties a test to a translation. Add the attribute to the component when it is missing; `FormInput` and `Button` forward unknown props, so no change to the shared components is needed.
- Data is different: team names, member names and numbers come from the fixture, not from a translation, so match them by role or text. `getByRole("heading", { name })` beats a testid there.
- `rpc: { accept_invitation: { error: "INVITE_CODE_INVALID" } }` makes an RPC fail with that ErrorCode. Those failures come from the database and a test cannot provoke them any other way, which is exactly what a mock is good for.
- Avoid fixed timeouts; rely on auto-waiting, with a timeout on the individual call when needed.
- Make invented people obviously invented - "Max Mustermann", "Erika Mustermann", "Firstname Lastname", "Testname Testlastname", ... In the future, nobody should have to work out whether a name in a fixture is real data or not.

## Key files

- `playwright.config.ts` — two URLs, one for the runner and one for the browser; see the comment at the top
- `mocks/supabase.ts` — `mockSupabase()`
- `pages/*` — page objects
