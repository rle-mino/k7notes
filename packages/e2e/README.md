# K7Notes E2E Tests

End-to-end tests for K7Notes using Playwright.

## Prerequisites

1. **PostgreSQL**: A running PostgreSQL instance with a separate test database
2. **Node.js**: Version 18 or later
3. **pnpm**: Installed globally

## Setup

### 1. Create Test Database

Create a separate database for testing to avoid polluting development data:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE k7notes_test;
```

### 2. Configure Environment

Copy the example environment file and configure:

```bash
cp packages/e2e/.env.example packages/e2e/.env
```

Edit `.env` and set:

```env
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/k7notes_test
```

### 3. Push Schema to Test Database

Ensure the test database has the correct schema:

```bash
# Set DATABASE_URL temporarily and push schema
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/k7notes_test pnpm -F @k7notes/api db:push
```

### 4. Install Playwright Browsers

```bash
pnpm -F @k7notes/e2e exec playwright install
```

## Running Tests

### Via Turbo (Recommended)

```bash
# Run all e2e tests (starts servers automatically)
pnpm test:e2e

# Or filter to just the e2e package
pnpm turbo test:e2e --filter=@k7notes/e2e
```

### Via Playwright CLI

```bash
# Run all tests
pnpm -F @k7notes/e2e test:e2e

# Run tests with UI
pnpm -F @k7notes/e2e test:e2e:ui

# Run tests in headed mode (see browser)
pnpm -F @k7notes/e2e test:e2e:headed

# Run specific test file
pnpm -F @k7notes/e2e test:e2e tests/auth/login.spec.ts

# Run tests matching pattern
pnpm -F @k7notes/e2e test:e2e -g "should create a note"
```

### Running Specific Projects

The test suite has two projects:

- **web**: Browser tests for the web application (port 4001)
- **api**: API endpoint tests (port 4000)

```bash
# Run only web tests
pnpm -F @k7notes/e2e test:e2e --project=web

# Run only API tests
pnpm -F @k7notes/e2e test:e2e --project=api
```

## Test Structure

```
packages/e2e/
  playwright.config.ts   # Playwright configuration
  global-setup.ts        # Pre-test setup (database cleanup)
  global-teardown.ts     # Post-test cleanup (server shutdown)
  fixtures/
    api.ts               # API request helpers
    auth.ts              # Authentication helpers (login, signup, logout)
  utils/
    db.ts                # Database connection utilities
    seed.ts              # Test data seeding helpers
    cleanup.ts           # Test data cleanup utilities
  tests/
    api/
      health.spec.ts     # API health check tests
    auth/
      login.spec.ts      # Login flow tests
      logout.spec.ts     # Logout flow tests
      signup.spec.ts     # Registration flow tests
    notes/
      create.spec.ts     # Note creation tests
      read.spec.ts       # Note list and detail tests
      update.spec.ts     # Note editing tests
      delete.spec.ts     # Note deletion tests
    folders/
      create.spec.ts     # Folder creation tests
      organize.spec.ts   # Note organization tests
      nested.spec.ts     # Nested folder hierarchy tests
    search/
      search.spec.ts     # Full-text search tests
    recents/
      recents.spec.ts    # Recent notes view tests
```

## Server Management

Playwright automatically starts the API and web servers before tests:

- **API Server**: Started via `pnpm turbo dev --filter=@k7notes/api` on port 4000
- **Web Server**: Started via `pnpm turbo start --filter=@k7notes/mobile -- --web` on port 4001

The servers are started with `DATABASE_URL` set to `TEST_DATABASE_URL` to ensure tests run against the test database.

### Important Notes

- **Stop existing servers**: If you have dev servers running, stop them before running e2e tests. Playwright starts fresh servers with the test database.
- **Server startup timeout**: Servers have a 2-minute timeout to start. If you see timeout errors, check that your servers can start successfully.
- **Port conflicts**: Ensure ports 4000 and 4001 are available before running tests.

## Writing Tests

### Authentication Helper

Use the auth fixture for tests that require authentication:

```typescript
import { test, expect } from "@playwright/test";
import { authFixture } from "../../fixtures/auth";

test.describe("My Feature", () => {
  const auth = authFixture();

  test.beforeEach(async ({ page }) => {
    // Create a fresh user and log in
    await auth.signup(page);
  });

  test("should do something", async ({ page }) => {
    // Test code here - user is already logged in
  });
});
```

### API Requests

Use the API fixture for endpoint testing:

```typescript
import { test, expect } from "@playwright/test";
import { apiFixture } from "../../fixtures/api";

test.describe("API Tests", () => {
  const api = apiFixture();

  test("should call endpoint", async ({ request }) => {
    const response = await api.get(request, "/some-endpoint");
    expect(response.ok()).toBe(true);
  });
});
```

### Test Data

Each test should create its own data and not rely on shared state:

```typescript
test.beforeEach(async ({ page }) => {
  // Create fresh user for each test
  await auth.signup(page);
});
```

## Debugging

### Visual Debugging

```bash
# Run with Playwright Inspector
PWDEBUG=1 pnpm -F @k7notes/e2e test:e2e

# Run in headed mode
pnpm -F @k7notes/e2e test:e2e:headed
```

### Viewing Reports

After test runs, Playwright generates HTML reports:

```bash
# Open the HTML report
pnpm -F @k7notes/e2e exec playwright show-report
```

### Traces

Traces are captured on test retries. View them with:

```bash
pnpm -F @k7notes/e2e exec playwright show-trace test-results/path-to-trace.zip
```

## Troubleshooting

### "TEST_DATABASE_URL environment variable is required"

Ensure you have a `.env` file in `packages/e2e/` with `TEST_DATABASE_URL` set.

### "Port 4000/4001 already in use"

Stop any running dev servers before running e2e tests:

```bash
# Kill processes on ports 4000 and 4001
lsof -ti :4000 | xargs kill -9
lsof -ti :4001 | xargs kill -9
```

### Database connection errors

1. Verify PostgreSQL is running
2. Verify the test database exists
3. Verify `TEST_DATABASE_URL` credentials are correct
4. Ensure schema has been pushed to the test database

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check if servers are starting correctly
- Verify network connectivity to localhost ports
