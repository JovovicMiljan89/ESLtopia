---
description: Review all code in the project — tests, Edge Functions, migrations, and the React component — and report findings by severity.
---

# Project Code Review

Perform a thorough code review of the english-app project. Review **$ARGUMENTS** if specified, otherwise review all source files.

## What to cover

### 1. Tests (`tests/`)

- **Isolation**: each test must use `uniqueEmail(prefix)` — no hard-coded addresses, no shared state between describe blocks.
- **Fixture setup**: fixture users must be created with `createConfirmedUser` in `beforeAll`, not via the signup UI.
- **Helper reuse**: `loginToApp` from `helpers/ui` must be used instead of copy-pasted login flows.
- **Assertions**: every `click()` on a button that triggers async work should be followed by an `expect(...).toBeVisible({ timeout })`.
- **Teardown**: all test addresses must end with `@example.test` so the global teardown purges them.
- **Dead code**: any local helper that duplicates something in `helpers/cleanup.ts` or `helpers/ui.ts`.
- **Type safety**: all function parameters should have TypeScript types; avoid `any`.

### 2. Edge Functions (`supabase/functions/`)

- **Auth**: every function must call `requireSchool` (or equivalent) before doing anything sensitive.
- **Ownership checks**: operations on a resource must verify the caller owns it before mutating.
- **Error handling**: the outer `try/catch` must catch `Response` throws from `requireSchool` and re-emit them with CORS headers via `withCors`.
- **Input validation**: required fields must be checked and return a 400 before hitting the DB.
- **CORS**: every handler must return CORS headers on `OPTIONS` and on all responses via the `json()` / `withCors()` helpers.

### 3. Shared Edge Function helpers (`supabase/functions/_shared/`)

- `serviceClient()` must never be called with user-supplied values.
- `requireSchool` must verify both `role === 'school'` and `status === 'active'` before granting access.

### 4. Database migrations (`supabase/migrations/`)

- **RLS policies**: every table must have RLS enabled. Each policy should be as narrow as possible.
- **Column guards**: check that the `guard_profile_columns` trigger blocks self-escalation for all privileged columns.
- **Idempotency**: migrations must use `create ... if not exists` / `drop ... if exists` / `alter ... add column if not exists`.
- **Cascade behaviour**: verify `on delete` rules are intentional (cascade vs. set null vs. restrict).

### 5. React component (`src/EnglishGenerator.jsx`)

- **Dead code**: any function, variable, or branch that is never reached.
- **State management**: `useState` and `useEffect` hooks should not have missing or incorrect dependencies.
- **Supabase calls**: all `supabase.*` calls should handle the error case and not silently swallow errors.
- **Security**: no user-supplied values should be interpolated into SQL or used as RLS bypass vectors.

### 6. Config files (`playwright.config.ts`, `vite.config.js`, `vercel.json`)

- No hardcoded secrets; environment variables must come from `process.env` / `import.meta.env`.
- `playwright.config.ts`: `retries` must be non-zero only when explicitly justified.

## Severity levels

| Level | Meaning |
|-------|---------|
| **CRITICAL** | Security hole, data loss risk, or test always passes incorrectly |
| **HIGH** | Functional bug, broken test isolation, or missing auth check |
| **MEDIUM** | Code duplication that will cause drift, missing type annotation that hides bugs |
| **LOW** | Style, readability, minor inefficiency |

## Output format

Group findings by file. For each finding include:

```
[SEVERITY] file:line — one-sentence description
  Why: why this is a problem
  Fix: what to change
```

End with a summary table:

| CRITICAL | HIGH | MEDIUM | LOW |
|----------|------|--------|-----|
| N        | N    | N      | N   |

## Steps

1. Read every file in `tests/`, `supabase/functions/`, `supabase/migrations/`, and `src/`.
2. Apply the criteria above.
3. Report findings — most severe first within each file.
4. If `$ARGUMENTS` specifies a file or area, scope the review to that area only.
