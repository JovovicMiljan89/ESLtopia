---
description: Write a new Playwright E2E test for this project. Pass a description of what to test, e.g. /write-test "teacher can change their display name"
---

# Write a Playwright E2E Test

Write a new Playwright E2E spec for the english-app project based on the user's description: **$ARGUMENTS**

## Project context

- **Stack**: React + Vite frontend, Supabase auth + Postgres backend, Edge Functions (Deno), deployed to Vercel at `https://esltopia.vercel.app`
- **Test runner**: Playwright `@playwright/test` — TypeScript, `tests/` directory
- **Config**: `playwright.config.ts` — tests run against `https://esltopia.vercel.app` (or `$BASE_URL`), Chromium only, `fullyParallel: true`, global teardown purges `@example.test` users
- **Shared helpers**:
  - `tests/helpers/cleanup.ts` — `createConfirmedUser`, `getProfile`, `confirmUser`, `setProfileStatus`, `getAccessToken`, `generateRecoveryLink`, `deleteTestUsers`, `uniqueEmail`
  - `tests/helpers/ui.ts` — `loginToApp(page, email, password)` (logs in and clicks "Get started")

## Rules for new tests

1. **Always use `uniqueEmail(prefix)` from cleanup** for every test address — never hard-code email strings. All addresses must end with `@example.test` so the global teardown purges them.
2. **Create fixture users with `createConfirmedUser`** in `test.beforeAll` — never go through the UI signup flow to set up a fixture.
3. **Use `loginToApp(page, email, password)` from `../helpers/ui`** whenever you need a fully-authenticated session in the app shell. Only write the login form manually when the test is specifically about the login form.
4. **One `test.describe` per logical feature area.** Tests within a describe share a `beforeAll` for fixture setup.
5. **Test file location**: place new specs in `tests/auth/` for auth-related tests. Create a new subdirectory (e.g. `tests/worksheet/`) for non-auth features.
6. **File naming**: `kebab-case.spec.ts`
7. **No fixture state shared between describe blocks** — each describe block sets up its own users.
8. **Edge function tests** use the `invoke(request, fn, token, payload)` pattern from `school-teachers.spec.ts` rather than Playwright's `page`.
9. **No comments explaining what the code does** — only add comments for non-obvious WHY (e.g., why we use the admin API instead of the UI).
10. **Retries**: add `test.describe.configure({ retries: 2 })` only when the test involves external SMTP (invite emails, registration confirmation).

## Selector conventions

| What | How |
|------|-----|
| Buttons | `page.getByRole('button', { name: /pattern/i })` |
| Inputs | `page.getByPlaceholder('placeholder text')` |
| CSS-class elements | `page.locator('.class-name', { hasText: '...' })` |
| Submit button | `page.locator('button[type="submit"].gen-btn')` |
| Tab buttons | `page.locator('button.tab', { hasText: 'TabName' })` |

## Timeout conventions

| Situation | Timeout |
|-----------|---------|
| Supabase API calls (login, signup) | `15_000` |
| Email confirmation step | `30_000` |
| Client-side validation (instant) | no timeout override |
| Sign-out / navigation | `10_000` |

## Steps

1. Read `tests/auth/` to understand the existing test patterns if the test involves auth.
2. Identify which shared helpers are needed.
3. Write the spec file, following all rules above.
4. Run `npx playwright test --list` to confirm it parses correctly.
5. Report the file path and a summary of what each test covers.
