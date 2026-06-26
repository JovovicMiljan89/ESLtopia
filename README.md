# ESLtopia

AI-powered English worksheet and lesson-content generator for teachers and language schools.

Built with React + Vite, Supabase (auth, database, edge functions), and deployed on Vercel.

## Features

- AI-generated worksheets, exercises, and lesson materials
- Role-based access: **Teacher**, **School** (manages teachers), **Superadmin**
- School admins can invite, deactivate, and remove their teachers
- Password recovery flow via email
- Pending/inactive account enforcement at login and session restore

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Auth & DB | Supabase (GoTrue, PostgreSQL, Edge Functions) |
| Hosting | Vercel |
| Tests | Playwright (E2E + API) |

## Local development

```bash
npm install
npm run dev        # starts Vite dev server at http://localhost:5173
```

Environment variables — copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Running tests

Tests run against the deployed production URL by default.

```bash
# one-time setup
npx playwright install chromium

# run all tests
npm test

# run with Playwright UI (watch mode)
npm run test:ui

# open the last HTML report
npm run test:report
```

### Required env for tests

Add to `.env.test.local` (git-ignored):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # needed to create/delete test users
BASE_URL=https://esltopia.vercel.app
```

Test users are created under the `@example.test` domain and purged automatically after each run.

### Feature-flagged tests

The school-teacher edge-function tests are skipped until the feature is deployed:

```bash
FEATURE_SCHOOL_TEACHERS=1 npm test   # enable once edge functions are live
```

## Test coverage

| Spec | What it covers |
|---|---|
| `login.spec.ts` | UI login, password/email validation, API token grant (password + refresh) |
| `registration.spec.ts` | UI signup (teacher + school), form validation, API signup, DB trigger role defaults |
| `logout.spec.ts` | UI sign-out, API logout, session invalidation |
| `forgot-password.spec.ts` | UI forgot-password form, API recover endpoint |
| `password-reset.spec.ts` | Recovery link flow, validation, single-use enforcement |
| `roles.spec.ts` | Superadmin coercion, admin portal access, account status restrictions, JWT claims |
| `navigation.spec.ts` | Auth guards, session persistence across reload, deactivated-account eviction |
| `school-teachers.spec.ts` | School creates/manages/removes teachers, edge-function error handling |

## Deployment

Push to `main` → Vercel builds and deploys automatically.

```bash
git push origin main
```

## CI

GitHub Actions runs two scheduled workflows:

- **daily-tests** — full Playwright suite against production every day
- **daily-registrations** — registration report
